#!/bin/bash

# Make sure script uses bash
set -e

# Set environment variables for performance
export PYTHONUNBUFFERED=1
export NUMBA_CACHE_DIR=/tmp/numba_cache
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1

# Debug: show PORT
echo "PORT is ${PORT}"

# Create numba cache dir
mkdir -p /tmp/numba_cache

# Run Django migrations
echo "Running Django migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Use PORT from Render or fallback for local
PORT=${PORT:-8000}

# Start Gunicorn
echo "Starting Gunicorn on 0.0.0.0:${PORT}..."
exec gunicorn core.wsgi:application \
  --bind 0.0.0.0:$PORT \
  --workers 1 \
  --timeout 120 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --preload
