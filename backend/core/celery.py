import os
from celery import Celery
import ssl

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# --- SSL fix for Upstash/Redis ---
from django.conf import settings
broker_url = getattr(settings, 'CELERY_BROKER_URL', '')
result_backend = getattr(settings, 'CELERY_RESULT_BACKEND', '')

if broker_url.startswith('rediss://'):
    app.conf.broker_use_ssl = {'ssl_cert_reqs': ssl.CERT_NONE}
if result_backend.startswith('rediss://'):
    app.conf.redis_backend_use_ssl = {'ssl_cert_reqs': ssl.CERT_NONE}

# Windows-specific configuration
if os.name == 'nt':  # Windows
    app.conf.update(
        worker_pool='solo',  # Use solo pool for Windows
        worker_concurrency=1,  # Single worker process
        task_always_eager=False,  # Don't run tasks synchronously
        broker_connection_retry_on_startup=True,
    )

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
