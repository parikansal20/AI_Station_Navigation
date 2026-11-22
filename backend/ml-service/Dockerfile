# Production Dockerfile for SAARTHI ML & Chatbot Service (Render Account 2)
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install system dependencies for OpenCV, PyTorch, and C++ builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirement definitions first for Docker layer caching
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and RAG knowledge base
COPY . .

# Expose container port
EXPOSE 8000

# Start production server using single Gunicorn worker + 2 threads (fits in 512MB RAM, 120s timeout)
CMD ["sh", "-c", "gunicorn -w 1 --threads 2 --timeout 120 --keep-alive 65 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-8000} src.main:app"]
