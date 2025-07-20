FROM python:3.11-slim

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

COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 8000

# Use Gunicorn for production (recommended for Render)
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]