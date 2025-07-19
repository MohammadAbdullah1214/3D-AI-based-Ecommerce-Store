# Dockerfile.django

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies and distutils for Python 3.12
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    python3-venv \
    python3-distutils \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project files into the container
COPY . .

# Expose Django default port
EXPOSE 8000

# Run the Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
