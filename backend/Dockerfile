# Dockerfile

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies and OpenCV dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    python3-venv \
    gcc \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the whole project
COPY . .

# Make startup script executable
RUN chmod +x start.sh

# Expose port (Render ignores this but good practice)
EXPOSE 8000

# Set env vars
ENV PYTHONUNBUFFERED=1
ENV NUMBA_CACHE_DIR=/tmp/numba_cache
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1

# Run startup script
CMD ["./start.sh"]
