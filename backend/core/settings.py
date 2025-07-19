import os
from pathlib import Path
from datetime import timedelta
import environ
import ssl

BASE_DIR = Path(__file__).resolve().parent.parent
# Try to load .env and print a warning if not found
ENV_PATH = os.path.join(BASE_DIR, '.env')
if not os.path.exists(ENV_PATH):
    print(f"WARNING: .env file not found at {ENV_PATH}. Environment variables may be missing.")

env = environ.Env()
env.read_env(ENV_PATH)

SECRET_KEY = env('DJANGO_SECRET_KEY', default='changeme-in-prod')
DEBUG = env.bool('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['*'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'corsheaders',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'celery',
    # Local apps
    'core.apps.CoreConfig',
    'users',
    'products',
    'ai_3d_generation',
    'carts',
    'shipping',
    'orders',
    'analytics',
    'payments',
    'qna',
    'chatbot',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'middleware.RoleMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# --- DATABASES ---
# Use DATABASE_URL from .env (Supabase style)
try:
    DATABASES = {
        'default': env.db(),
    }
except Exception as e:
    print("\nERROR: Could not configure database from DATABASE_URL.\n" \
          "Check your .env file for DATABASE_URL.\n" \
          f"Details: {e}\n")
    raise

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.CustomUser'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_SCHEMA_CLASS': 'core.schema.CustomAutoSchema',
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# Initialize empty ENUM_NAME_OVERRIDES - will be populated by CoreConfig.ready()
ENUM_NAME_OVERRIDES = {}

SPECTACULAR_SETTINGS = {
    'TITLE': 'E-Commerce API',
    'DESCRIPTION': 'API for E-Commerce platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
    },
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'Bearer': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    },
    'SECURITY': [{'Bearer': []}],
    'ENUM_NAME_OVERRIDES': ENUM_NAME_OVERRIDES,
    'OPERATION_SORTER': 'core.schema.custom_operation_sorter',
    'TAG_PLUGINS': [
        'drf_spectacular.contrib.django_filters.DjangoFilterExtension',
    ],
}

SITE_ID = 1

# Celery Configuration - Windows optimized
# Celery/Redis settings (Upstash)
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Upstash/Redis SSL config
CELERY_BROKER_USE_SSL = {'ssl_cert_reqs': ssl.CERT_NONE}
CELERY_REDIS_BACKEND_USE_SSL = {'ssl_cert_reqs': ssl.CERT_NONE}

# Windows-specific Celery settings
if os.name == 'nt':  # Windows
    CELERY_WORKER_POOL = 'solo'
    CELERY_WORKER_CONCURRENCY = 1

# 3D Generation Settings
BLENDER_EXECUTABLE_PATH = r"C:/Users/Abdul Rehman/Downloads/blender-4.0.2-windows-x64/blender.exe"
MAX_GENERATION_QUEUE_SIZE = env('MAX_GENERATION_QUEUE_SIZE', default=10)
GENERATION_TIMEOUT_MINUTES = env('GENERATION_TIMEOUT_MINUTES', default=30)