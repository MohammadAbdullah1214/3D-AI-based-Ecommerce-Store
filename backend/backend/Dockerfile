# Base image
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && \
    apt-get install -y wget python3 python3-pip libgl1-mesa-glx && \
    rm -rf /var/lib/apt/lists/*

# Install Blender (headless)
ENV BLENDER_VERSION=4.0.2
RUN wget https://download.blender.org/release/Blender${BLENDER_VERSION%.*}/blender-${BLENDER_VERSION}-linux-x64.tar.xz && \
    tar -xf blender-${BLENDER_VERSION}-linux-x64.tar.xz && \
    mv blender-${BLENDER_VERSION}-linux-x64 /opt/blender && \
    ln -s /opt/blender/blender /usr/local/bin/blender

# Set working directory
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .

RUN pip3 install --upgrade pip && \
    pip3 install -r requirements.txt

# Copy Django apps and project files
COPY ai_3d_generation /app/ai_3d_generation
COPY core /app/core
COPY products /app/products
COPY users /app/users
COPY carts /app/carts
COPY shipping /app/shipping
COPY orders /app/orders
COPY analytics /app/analytics
COPY payments /app/payments
COPY qna /app/qna
COPY chatbot /app/chatbot

# Copy manage.py and other root-level files if needed
COPY manage.py .

# Set environment variable for Django
ENV DJANGO_SETTINGS_MODULE=core.settings

# Optional health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD pgrep -f 'celery worker' || exit 1

# Start Celery worker with Blender support
CMD ["celery", "-A", "core", "worker", "--loglevel=info"]
