from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """
        Initialize app when Django starts.
        """
        # Import and run setup for spectacular settings
        from core.schema import setup_spectacular_settings
        setup_spectacular_settings()