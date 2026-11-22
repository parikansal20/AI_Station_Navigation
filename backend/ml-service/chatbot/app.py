import os
import json
import base64
import tempfile
import time
import requests
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from rag_engine import RAGEngine
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

# ----- Configuration -----
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
if not SARVAM_API_KEY:
    raise ValueError("SARVAM_API_KEY not found in .env file!")

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------- IMAGE MAPPING ----------
IMAGE_MAPPING_FILE = "image_mapping.json"
if os.path.exists(IMAGE_MAPPING_FILE):
    with open(IMAGE_MAPPING_FILE, 'r') as f:
        IMAGE_MAPPING = json.load(f)
    print(f"[INIT] Loaded image mapping for {len(IMAGE_MAPPING)} documents")
else:
    IMAGE_MAPPING = {}
    print("[INIT] No image mapping found. Run extract_images.py first.")

STATIC_IMAGE_FALLBACKS = {
    "rail madad": ("/static/images/extracted/Rail Madad_ All In One Railway Helpline Number_RailMitra_page1_img1.png", "Rail Madad_ All In One Railway Helpline Number_RailMitra", 1),
    "helpline": ("/static/images/extracted/Rail Madad_ All In One Railway Helpline Number_RailMitra_page1_img1.png", "Rail Madad_ All In One Railway Helpline Number_RailMitra", 1),
    "139": ("/static/images/extracted/Rail Madad_ All In One Railway Helpline Number_RailMitra_page1_img1.png", "Rail Madad_ All In One Railway Helpline Number_RailMitra", 1),
}

IMAGE_REQUEST_KEYWORDS = [
    "show me", "show image", "show picture", "show photo",
    "display image", "display picture", "display photo",
    "image of", "picture of", "photo of",
    "visual", "diagram", "map", "layout", "schematic",
    "see image", "see picture", "see photo",
    "show", "display", "view image", "view picture"
]

def should_show_images(query):
    query_lower = query.lower()
    for keyword in IMAGE_REQUEST_KEYWORDS:
        if keyword in query_lower:
            return True
    return False

def get_images_for_query(query, sources):
    query_lower = query.lower()
    image_objects = []
    if not should_show_images(query):
        return []
    for keyword, (img_url, doc_name, page) in STATIC_IMAGE_FALLBACKS.items():
        if keyword in query_lower:
            image_objects.append({
                'url': img_url,
                'doc': doc_name,
                'page': page
            })
    for source in sources:
        doc_name = source.replace('.txt', '').replace('.md', '')
        if doc_name in IMAGE_MAPPING:
            for img_data in IMAGE_MAPPING[doc_name][:3]:
                img_filename = img_data['filename']
                page = img_data['page']
                img_url = f"/static/images/extracted/{img_filename}"
                if not any(img['url'] == img_url for img in image_objects):
                    image_objects.append({
                        'url': img_url,
                        'doc': doc_name,
                        'page': page
                    })
    return image_objects

# ---------- Initialize RAG ----------
print("[INIT] Loading RAG Engine...")
rag = RAGEngine()
print("[INIT] RAG Engine loaded successfully.")

# ----- Helper Functions -----
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------- SARVAM SAARAS v3 (STT) ----------
def call_sarvam_stt(audio_file_path):
    """
    Transcribes audio using Sarvam's Saaras v3 model.
    """
    url = "https://api.sarvam.ai/speech-to-text"
    headers = {"api-subscription-key": SARVAM_API_KEY}
    
    data = {
        "model": "saaras:v3",
        "mode": "transcribe",
        "language_code": "unknown"
    }
    
    with open(audio_file_path, 'rb') as f:
        files = {'file': (os.path.basename(audio_file_path), f, 'audio/wav')}
        response = requests.post(url, headers=headers, data=data, files=files, timeout=30)
    
    if response.status_code == 200:
        result = response.json()
        transcript = result.get('transcript', '')
        language = result.get('language_code', 'hi-IN')
        if not transcript or not transcript.strip():
            return "[Silence or unrecognized speech]", language
        return transcript, language
    else:
        error_msg = f"STT error: {response.status_code} - {response.text}"
        print(error_msg)
        raise Exception(error_msg)

# ---------- SARVAM BULBUL v3 (TTS) - FIXED ----------
def call_sarvam_tts(text, speaker="shubh", language="hi-IN"):
    """
    Generates speech audio using Sarvam's Bulbul v3 model.
    The API expects 'text' as the key for the input text.
    """
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    
    # THE FIX: Use 'text' as the key, NOT 'input'
    payload = {
        "model": "bulbul:v3",
        "text": text,  # <-- THIS WAS THE ISSUE (was 'input')
        "speaker": speaker,
        "target_language_code": language,
        "output_format": "wav"  # Explicitly request WAV format
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    
    if response.status_code == 200:
        result = response.json()
        # The response may have 'audios' array or directly 'audio'
        if 'audios' in result and len(result['audios']) > 0:
            audio_b64 = result['audios'][0]
            audio_bytes = base64.b64decode(audio_b64)
            return audio_bytes
        elif 'audio' in result:
            audio_bytes = base64.b64decode(result['audio'])
            return audio_bytes
        else:
            # If the response is a direct binary stream (some versions)
            return response.content
    else:
        error_msg = f"TTS error: {response.status_code} - {response.text}"
        print(error_msg)
        raise Exception(error_msg)

# ---------- OCR ----------
def extract_text_from_image(image_path):
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(image_path)
        img = img.convert('L')
        text = pytesseract.image_to_string(img, config='--psm 6')
        return text.strip()
    except ImportError as e:
        return f"OCR not available: {str(e)}"
    except Exception as e:
        return f"OCR error: {str(e)}"

def safe_delete(file_path, max_attempts=5):
    for attempt in range(max_attempts):
        try:
            os.unlink(file_path)
            return
        except PermissionError:
            if attempt < max_attempts - 1:
                time.sleep(0.5)
                continue
            else:
                print(f"[WARN] Could not delete temporary file: {file_path}")
                pass

# ----- API Routes -----
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    query = data.get('query', '').strip()
    if not query:
        return jsonify({'error': 'Empty query'}), 400
    
    print(f"[QUERY] {query}")
    
    show_images = should_show_images(query)
    answer, sources, source_type, metrics = rag.ask(query, images_available=show_images)
    
    timestamp = datetime.now().isoformat()
    
    final_images = []
    if show_images:
        final_images = get_images_for_query(query, sources)
    
    if source_type == 'none' and final_images:
        matched_keyword = None
        query_lower = query.lower()
        for keyword in STATIC_IMAGE_FALLBACKS.keys():
            if keyword in query_lower:
                matched_keyword = keyword
                break
        if matched_keyword:
            answer = f"Here is an image related to {matched_keyword.title()}."
        else:
            answer = "Here is an image related to your query."
        source_type = 'image'
    
    response_data = {
        'answer': answer,
        'sources': sources,
        'source_type': source_type,
        'images': final_images,
        'timestamp': timestamp,
        'llm_time': metrics.get('llm_time', 0),
        'retrieval_time': metrics.get('retrieval_time', 0),
        'input_tokens': metrics.get('input_tokens', 0),
        'output_tokens': metrics.get('output_tokens', 0),
        'total_tokens': metrics.get('total_tokens', 0),
        'cost_usd': metrics.get('cost_usd', 0),
        'cost_inr': metrics.get('cost_inr', 0),
        'tokens_per_second': metrics.get('tokens_per_second', 0)
    }
    
    print(f"[RESPONSE] Source: {source_type}, LLM: {metrics.get('llm_time', 0):.3f}s, "
          f"Tokens: {metrics.get('total_tokens', 0)}, Cost: ₹{metrics.get('cost_inr', 0):.6f}")
    
    return jsonify(response_data)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    text = extract_text_from_image(filepath)
    os.remove(filepath)
    print(f"[OCR] Extracted {len(text)} characters from {filename}")
    return jsonify({'text': text})

@app.route('/voice-input', methods=['POST'])
def voice_input():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No audio selected'}), 400
    
    temp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    audio_file.save(temp.name)
    temp.close()
    
    try:
        transcript, language = call_sarvam_stt(temp.name)
        print(f"[STT] Transcript: {transcript[:50]}... (Language: {language})")
        return jsonify({'transcript': transcript, 'language': language})
    except Exception as e:
        print(f"[ERROR] STT failed: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        safe_delete(temp.name)

@app.route('/voice-output', methods=['POST'])
def voice_output():
    data = request.json
    text = data.get('text', '')
    language = data.get('language', 'hi-IN')
    voice = data.get('voice', 'shubh')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        audio_bytes = call_sarvam_tts(text, speaker=voice, language=language)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(f"[TTS] Generated audio for {len(text)} characters (lang: {language}, voice: {voice})")
        return jsonify({'audio': audio_b64})
    except Exception as e:
        print(f"[ERROR] TTS failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/static/images/extracted/<path:filename>')
def serve_extracted_image(filename):
    return send_from_directory('static/images/extracted', filename)

@app.route('/pdf/<path:filename>')
def serve_pdf(filename):
    return send_from_directory('data', filename)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'chunks': rag.collection.count()})

if __name__ == '__main__':
    print("\n" + "="*60)
    print("S.A.R.T.H.I. Web Server Starting...")
    print("="*60)
    print(f"Server URL: http://127.0.0.1:5000")
    print("Press CTRL+C to stop the server")
    print("="*60 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)