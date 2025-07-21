import os
from pathlib import Path
from datetime import timedelta
import environ
import ssl

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
ENV_PATH = os.path.join(BASE_DIR, '.env')
env = environ.Env()

if os.path.exists(ENV_PATH):
    env.read_env(ENV_PATH)
    print(f".env file loaded from {ENV_PATH}")
else:
    print(f"WARNING: .env file not found at {ENV_PATH}. Using system environment variables.")

# Core settings
SECRET_KEY = env('DJANGO_SECRET_KEY', default='changeme-in-prod')
DEBUG = env.bool('DEBUG', default=False)  # ✅ Always default False for production
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['*'])  # ✅ Safe fallback for dev

# Installed apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'celery',
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
    'storages',  # Added for django-storages
]

# Middleware
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

# URL & WSGI
ROOT_URLCONF = 'core.urls'
WSGI_APPLICATION = 'core.wsgi.application'

# Templates
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

# Database — must set DATABASE_URL in Render
try:
    DATABASES = {
        'default': env.db(),
    }
except Exception as e:
    print(f"ERROR: Could not configure database. Ensure DATABASE_URL is set. Details: {e}")
    raise

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Language and time
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & media
STATIC_URL = 'static/'

# Supabase S3-compatible media storage
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = env('SUPABASE_ACCESS_KEY')
AWS_SECRET_ACCESS_KEY = env('SUPABASE_SECRET_KEY')
AWS_STORAGE_BUCKET_NAME = env('SUPABASE_BUCKET', default='store-media')
AWS_S3_REGION_NAME = 'ap-south-1'
AWS_S3_ENDPOINT_URL = f'https://{env("SUPABASE_PROJECT_REF")}.supabase.co/storage/v1/s3'
AWS_S3_ADDRESSING_STYLE = "path"
AWS_DEFAULT_ACL = None

MEDIA_URL = f'https://{env("SUPABASE_PROJECT_REF")}.supabase.co/storage/v1/object/public/{AWS_STORAGE_BUCKET_NAME}/'
MEDIA_ROOT = None  # Not used with S3 storage

# User model
AUTH_USER_MODEL = 'users.CustomUser'

# Default primary key
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST framework
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

# JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# API schema / Spectacular
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

# Celery — works on Render with env vars
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

CELERY_BROKER_USE_SSL = {'ssl_cert_reqs': ssl.CERT_NONE}
CELERY_REDIS_BACKEND_USE_SSL = {'ssl_cert_reqs': ssl.CERT_NONE}

if os.name == 'nt':  # Windows dev only
    CELERY_WORKER_POOL = 'solo'
    CELERY_WORKER_CONCURRENCY = 1

# 3D generation
BLENDER_EXECUTABLE_PATH = r"C:/Users/Abdul Rehman/Downloads/blender-4.0.2-windows-x64/blender.exe"
MAX_GENERATION_QUEUE_SIZE = env('MAX_GENERATION_QUEUE_SIZE', default=10)
GENERATION_TIMEOUT_MINUTES = env('GENERATION_TIMEOUT_MINUTES', default=30)
