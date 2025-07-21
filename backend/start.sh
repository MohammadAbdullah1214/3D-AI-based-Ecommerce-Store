#!/bin/bash
set -e
set -x

export PYTHONUNBUFFERED=1

PORT=${PORT:-8000}
echo "Starting on port $PORT"

exec gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 1
