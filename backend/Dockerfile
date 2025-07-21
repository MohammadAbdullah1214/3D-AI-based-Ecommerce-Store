# Dockerfile

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system + OpenCV dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    python3-venv \
    gcc \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better cache
COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project files
COPY . .

# Make startup script executable
RUN chmod +x start.sh

# Expose port (Render auto handles this but for docs)
EXPOSE 8000

# Environment settings to help Numba
ENV PYTHONUNBUFFERED=1
ENV NUMBA_CACHE_DIR=/tmp/numba_cache
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1

# Use ENTRYPOINT to ensure start.sh always runs
ENTRYPOINT ["bash", "./start.sh"]
