#!/bin/bash

# Set environment variables to reduce memory usage
export PYTHONUNBUFFERED=1
export NUMBA_CACHE_DIR=/tmp/numba_cache
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1

# Create cache directory
mkdir -p /tmp/numba_cache

# Run Django migrations
echo "Running Django migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn with memory-efficient settings
echo "Starting Gunicorn..."
exec gunicorn core.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --timeout 120 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload 