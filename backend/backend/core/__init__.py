default_app_config = 'core.apps.CoreConfig'
from .celery import app as celery_app

__all__ = ('celery_app',)
