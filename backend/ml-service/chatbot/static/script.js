// ============================================================
// MARKDOWN TO HTML PARSER
// ============================================================
function markdownToHtml(text) {
    if (!text) return text;
    let html = text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    let lines = html.split('\n');
    let newLines = [];
    let inList = false;
    let listType = '';
    for (let line of lines) {
        const bulletMatch = line.match(/^[\s]*([-*])\s+(.+)/);
        if (bulletMatch) {
            if (!inList) { inList = true; listType = 'ul'; newLines.push('<ul>'); }
            newLines.push('<li>' + bulletMatch[2] + '</li>');
        }
        else if (line.match(/^[\s]*\d+\.\s+(.+)/)) {
            const numMatch = line.match(/^[\s]*\d+\.\s+(.+)/);
            if (numMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) newLines.push('</ul>');
                    inList = true; listType = 'ol';
                    newLines.push('<ol>');
                }
                newLines.push('<li>' + numMatch[1] + '</li>');
            }
        }
        else if (inList && line.trim() !== '' && !line.match(/^[\s]*$/)) {
            newLines.push('<br>' + line.trim());
        }
        else {
            if (inList) { inList = false; newLines.push(listType === 'ul' ? '</ul>' : '</ol>'); listType = ''; }
            if (line.trim() === '') { newLines.push('<br>'); }
            else { newLines.push(line); }
        }
    }
    if (inList) { newLines.push(listType === 'ul' ? '</ul>' : '</ol>'); }
    return newLines.join('\n');
}

// ============================================================
// DOM REFS
// ============================================================
const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const loadingDots = document.getElementById('typingIndicator');

let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let isProcessing = false;

// Audio state
let currentAudio = null;
let currentPlayBtn = null;

// ============================================================
// AUDIO BUFFER TO WAV CONVERTER
// ============================================================
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const samples = buffer.getChannelData(0);
    const dataLength = samples.length * 2;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const sample = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' });
}
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function getBadgeClass(sourceType) {
    switch(sourceType) {
        case 'local': return 'badge-local';
        case 'none': return 'badge-none';
        case 'web': return 'badge-web';
        case 'general': return 'badge-general';
        case 'image': return 'badge-image';
        default: return '';
    }
}

function getBadgeLabel(sourceType) {
    switch(sourceType) {
        case 'local': return 'Station Documents';
        case 'none': return 'No Documents Found';
        case 'web': return 'Web Search';
        case 'general': return 'General Knowledge';
        case 'image': return 'Image from Documents';
        default: return '';
    }
}

function addMessage(text, sender, sources = [], sourceType = 'local', lang = 'hi-IN', images = [], metadata = {}) {
    const div = document.createElement('div');
    div.classList.add('message', sender);

    let content = markdownToHtml(text);
    
    if (sender === 'bot') {
        // Badge
        const badge = document.createElement('span');
        badge.className = 'badge ' + getBadgeClass(sourceType);
        badge.textContent = getBadgeLabel(sourceType);
        div.appendChild(badge);
        div.appendChild(document.createElement('br'));
        
        // Main content
        const contentWrapper = document.createElement('div');
        contentWrapper.innerHTML = content;
        div.appendChild(contentWrapper);
        
        // --- IMAGES ---
        if (images && images.length > 0) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-container';
            
            images.forEach(imgObj => {
                const imgUrl = typeof imgObj === 'string' ? imgObj : imgObj.url;
                const doc = typeof imgObj === 'string' ? '' : (imgObj.doc || '');
                const page = typeof imgObj === 'string' ? 1 : (imgObj.page || 1);
                
                const wrapper = document.createElement('div');
                wrapper.className = 'image-wrapper';
                
                const pdfLink = document.createElement('a');
                if (doc) {
                    const pdfName = doc + '.pdf';
                    pdfLink.href = '/pdf/' + pdfName + '#page=' + page;
                    pdfLink.target = '_blank';
                } else {
                    pdfLink.href = imgUrl;
                    pdfLink.target = '_blank';
                }
                pdfLink.style.display = 'block';
                
                const img = document.createElement('img');
                img.src = imgUrl;
                img.alt = 'Document image';
                img.loading = 'lazy';
                img.onerror = function() {
                    this.style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.className = 'image-fallback';
                    fallback.textContent = 'Image not available';
                    wrapper.appendChild(fallback);
                };
                pdfLink.appendChild(img);
                wrapper.appendChild(pdfLink);
                
                if (doc) {
                    const caption = document.createElement('div');
                    caption.className = 'image-caption';
                    caption.textContent = doc + ' (Page ' + page + ')';
                    wrapper.appendChild(caption);
                }
                
                imgContainer.appendChild(wrapper);
            });
            div.appendChild(imgContainer);
        }
        
        // Sources (citations)
        if (sources && sources.length > 0 && (sourceType === 'local' || sourceType === 'image')) {
            const srcDiv = document.createElement('div');
            srcDiv.className = 'sources';
            const links = sources.map(src => {
                const pdfName = src.replace('.txt', '.pdf').replace('.md', '.pdf');
                return '<a href="/pdf/' + pdfName + '" target="_blank">' + src + '</a>';
            });
            srcDiv.innerHTML = 'Sources: ' + links.join(' | ');
            div.appendChild(srcDiv);
        } else if (sources && sources.length > 0 && sourceType === 'web') {
            const srcDiv = document.createElement('div');
            srcDiv.className = 'sources';
            const links = sources.map(src => '<a href="' + src + '" target="_blank">' + src + '</a>');
            srcDiv.innerHTML = 'Sources: ' + links.join(' | ');
            div.appendChild(srcDiv);
        }
        
        // Audio controls
        const audioControls = document.createElement('div');
        audioControls.className = 'audio-controls';
        
        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.textContent = '▶';
        playBtn.title = 'Play audio response';
        playBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const textToSpeak = div.dataset.text;
            if (!textToSpeak) return;
            const language = div.dataset.lang || 'hi-IN';
            if (div._audio && !div._audio.ended) {
                if (div._audio.paused) {
                    div._audio.play();
                    playBtn.textContent = '⏸';
                } else {
                    div._audio.pause();
                    playBtn.textContent = '▶';
                }
                return;
            }
            playBtn.disabled = true;
            playBtn.textContent = '...';
            playTTS(textToSpeak, language, div).then(() => {
                playBtn.disabled = false;
            }).catch(() => {
                playBtn.disabled = false;
                playBtn.textContent = '▶';
            });
        });
        audioControls.appendChild(playBtn);
        
        const stopBtn = document.createElement('button');
        stopBtn.className = 'stop-btn';
        stopBtn.textContent = '■';
        stopBtn.title = 'Stop audio';
        stopBtn.style.display = 'none';
        stopBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (div._audio) {
                div._audio.pause();
                div._audio.currentTime = 0;
                playBtn.textContent = '▶';
                stopBtn.style.display = 'none';
                if (currentAudio === div._audio) {
                    currentAudio = null;
                    currentPlayBtn = null;
                }
            }
        });
        audioControls.appendChild(stopBtn);
        div.appendChild(audioControls);
        
        // Store references
        div._playBtn = playBtn;
        div._stopBtn = stopBtn;
        div._audio = null;
        div.dataset.text = text;
        div.dataset.lang = lang || 'hi-IN';
        
        // Metadata footer
        if (metadata && Object.keys(metadata).length > 0) {
            const footer = document.createElement('div');
            footer.className = 'meta-footer';
            if (metadata.timestamp) {
                const timeSpan = document.createElement('span');
                const date = new Date(metadata.timestamp);
                timeSpan.textContent = date.toLocaleTimeString();
                footer.appendChild(timeSpan);
            }
            if (metadata.llm_time && metadata.llm_time > 0) {
                const llmSpan = document.createElement('span');
                llmSpan.textContent = 'LLM: ' + metadata.llm_time.toFixed(2) + 's';
                footer.appendChild(llmSpan);
            }
            if (metadata.retrieval_time && metadata.retrieval_time > 0) {
                const retSpan = document.createElement('span');
                retSpan.textContent = 'Search: ' + metadata.retrieval_time.toFixed(2) + 's';
                footer.appendChild(retSpan);
            }
            if (metadata.total_tokens && metadata.total_tokens > 0) {
                const tokenSpan = document.createElement('span');
                tokenSpan.textContent = 'Tokens: ' + metadata.total_tokens;
                footer.appendChild(tokenSpan);
            }
            if (metadata.tokens_per_second && metadata.tokens_per_second > 0) {
                const tpsSpan = document.createElement('span');
                tpsSpan.textContent = 'Speed: ' + metadata.tokens_per_second.toFixed(0) + ' tok/s';
                footer.appendChild(tpsSpan);
            }
            if (metadata.cost_inr && metadata.cost_inr > 0) {
                const costSpan = document.createElement('span');
                costSpan.textContent = 'Cost: ₹' + metadata.cost_inr.toFixed(6);
                footer.appendChild(costSpan);
            }
            div.appendChild(footer);
        }
        
    } else {
        div.textContent = text;
    }

    chatWindow.insertBefore(div, loadingDots);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return div;
}

function setLoading(loading) {
    loadingDots.style.display = loading ? 'flex' : 'none';
    sendBtn.disabled = loading;
    micBtn.disabled = loading;
    userInput.disabled = loading;
    if (!loading) userInput.focus();
}

// ============================================================
// SEND TEXT QUERY
// ============================================================
async function sendQuery(query, autoSpeak = false, lang = 'hi-IN') {
    if (!query || isProcessing) return;
    isProcessing = true;
    setLoading(true);
    addMessage(query, 'user');

    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const data = await response.json();
        if (response.ok) {
            const metadata = {
                timestamp: data.timestamp,
                llm_time: data.llm_time || 0,
                retrieval_time: data.retrieval_time || 0,
                input_tokens: data.input_tokens || 0,
                output_tokens: data.output_tokens || 0,
                total_tokens: data.total_tokens || 0,
                tokens_per_second: data.tokens_per_second || 0,
                cost_usd: data.cost_usd || 0,
                cost_inr: data.cost_inr || 0
            };
            const msgDiv = addMessage(
                data.answer,
                'bot',
                data.sources || [],
                data.source_type || 'local',
                lang,
                data.images || [],
                metadata
            );
            if (autoSpeak && data.source_type !== 'none') {
                const playBtn = msgDiv._playBtn;
                if (playBtn) {
                    setTimeout(() => playBtn.click(), 300);
                }
            }
        } else {
            addMessage('Error: ' + (data.error || 'Something went wrong.'), 'bot');
        }
    } catch (err) {
        addMessage('Network error. Make sure the backend is running.', 'bot');
    }
    setLoading(false);
    isProcessing = false;
}

// ============================================================
// VOICE INPUT (STT)
// ============================================================
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            try {
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: 16000
                });
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const wavBlob = audioBufferToWav(audioBuffer);
                const formData = new FormData();
                formData.append('audio', wavBlob, 'recording.wav');
                setLoading(true);
                addMessage('Recording sent...', 'user');
                const response = await fetch('/voice-input', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (response.ok && data.transcript) {
                    const transcript = data.transcript;
                    const language = data.language || 'hi-IN';
                    if (transcript === '[Silence or unrecognized speech]') {
                        addMessage('I didn\'t catch that. Could you please speak again?', 'bot');
                        setLoading(false);
                        micBtn.classList.remove('recording');
                        isRecording = false;
                        return;
                    }
                    addMessage('Transcript: "' + transcript + '"', 'bot');
                    await sendQuery(transcript, true, language);
                } else {
                    addMessage('STT error: ' + (data.error || 'Unknown'), 'bot');
                }
            } catch (convErr) {
                console.error("Audio conversion error:", convErr);
                addMessage('Error processing audio. Please try again.', 'bot');
            }
            setLoading(false);
            micBtn.classList.remove('recording');
            isRecording = false;
        };
        mediaRecorder.start();
        micBtn.classList.add('recording');
        isRecording = true;
    } catch (err) {
        alert('Microphone access denied. Please allow microphone permissions.');
        console.error(err);
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

// ============================================================
// VOICE OUTPUT (TTS) with Play/Pause/Stop
// ============================================================
async function playTTS(text, language = 'hi-IN', messageDiv) {
    try {
        console.log('[TTS] Requesting audio (lang: ' + language + ')...');
        const response = await fetch('/voice-output', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language, voice: 'shubh' })
        });
        if (!response.ok) {
            console.error('[TTS] Server error:', response.status);
            const btn = messageDiv?._playBtn;
            if (btn) btn.textContent = '▶';
            return;
        }
        const data = await response.json();
        if (data.error || !data.audio) {
            console.warn('TTS error:', data.error);
            const btn = messageDiv?._playBtn;
            if (btn) btn.textContent = '▶';
            return;
        }
        const byteChars = atob(data.audio);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        
        if (messageDiv) {
            messageDiv._audio = audio;
            const playBtn = messageDiv._playBtn;
            const stopBtn = messageDiv._stopBtn;
            
            audio.onplay = () => {
                playBtn.textContent = '⏸';
                stopBtn.style.display = 'inline-block';
                if (currentAudio && currentAudio !== audio) {
                    if (currentPlayBtn) currentPlayBtn.textContent = '▶';
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    if (currentPlayBtn && currentPlayBtn !== playBtn) {
                        const otherDiv = currentPlayBtn.closest('.message');
                        if (otherDiv) {
                            const otherStop = otherDiv.querySelector('.stop-btn');
                            if (otherStop) otherStop.style.display = 'none';
                        }
                    }
                }
                currentAudio = audio;
                currentPlayBtn = playBtn;
            };
            audio.onpause = () => {
                playBtn.textContent = '▶';
            };
            audio.onended = () => {
                playBtn.textContent = '▶';
                stopBtn.style.display = 'none';
                URL.revokeObjectURL(audioUrl);
                if (currentAudio === audio) {
                    currentAudio = null;
                    currentPlayBtn = null;
                }
            };
            audio.onerror = (e) => {
                console.error('[TTS] Audio error:', e);
                playBtn.textContent = '▶';
                stopBtn.style.display = 'none';
                URL.revokeObjectURL(audioUrl);
            };
            
            try {
                await audio.play();
            } catch (playErr) {
                console.warn('Autoplay blocked. Click button to play.');
                playBtn.textContent = '▶';
                stopBtn.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('[TTS] Fatal error:', err);
        const btn = messageDiv?._playBtn;
        if (btn) btn.textContent = '▶';
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
sendBtn.addEventListener('click', () => {
    const q = userInput.value.trim();
    if (q) {
        userInput.value = '';
        sendQuery(q, false, 'hi-IN');
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

micBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

window.onload = () => userInput.focus();

console.log('S.A.R.T.H.I. UI ready.');
console.log('Voice: Speak, bot replies in your language.');
console.log('Audio: Play/Pause/Stop controls below each response.');
console.log('Images: Displayed when the backend returns them.');