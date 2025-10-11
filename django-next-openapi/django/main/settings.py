# main/settings.py
import os  # Added for environment variables
from datetime import timedelta
from distutils.util import strtobool
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = bool(strtobool(os.getenv("DJANGO_DEBUG", "False")))

ROOT_DOMAIN = os.getenv('ROOT_DOMAIN')
ALLOWED_HOSTS = [f'api.django-next.{ROOT_DOMAIN}', os.getenv('NEXT_DOMAIN'), os.getenv('SERVER_IP'),'django', 'localhost']

CSRF_TRUSTED_ORIGINS = [
    f"https://{f'api.django-next.{ROOT_DOMAIN}'}",
    f"http://{f'api.django-next.{ROOT_DOMAIN}'}",
    f"https://{os.getenv('SERVER_IP')}",
    f"http://{os.getenv('SERVER_IP')}",
    f"https://{os.getenv('COOKIE_DOMAIN')}",
    f"http://{os.getenv('COOKIE_DOMAIN')}",
    f"https://{os.getenv('NEXT_DOMAIN')}",
    f"http://{os.getenv('NEXT_DOMAIN')}",
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True  # Allow sending authentication cookies

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_DOMAIN = f'api.django-next.{ROOT_DOMAIN}'
SESSION_COOKIE_SECURE = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/quant.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'corsheaders': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'access': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'dashboard': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-Party
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'django_filters',
    'django_extensions',
    'corsheaders',
    'celery',

    # Our own
    'access.apps.AccessConfig',
    'dashboard.apps.DashboardConfig',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'access.auth.CookieJWTAuthentication',  # use your custom auth class
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # optional, if you want to support session auth too
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        "rest_framework.filters.SearchFilter",
        "dashboard.filters.TimestampFilterBackend",
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100
}

# Use our custom user model from the dashboard app
AUTH_USER_MODEL = 'dashboard.User'

# Configure email (adjust as needed for your email provider)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
EMAIL_PORT = os.getenv('EMAIL_HOST_PORT')
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False

# ENV VARS
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_REDIRECT_DASHBOARD_URI = os.getenv("GOOGLE_REDIRECT_DASHBOARD_URI")
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")
NEXT_DOMAIN = os.getenv("NEXT_DOMAIN")

STRIPE_SECRET_KEY = os.getenv('STRIPE_TEST_SECRET_KEY', default=None)
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_TEST_PUBLISHABLE_KEY', default=None)
STRIPE_WEBHOOK_SECRET_KEY = os.getenv('STRIPE_TEST_WEBHOOK_SECRET_KEY', default=None)

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=6),  # adjust as needed
    'REFRESH_TOKEN_LIFETIME': timedelta(days=3),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,  # using your Django SECRET_KEY
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'OpenAPI Schema',
    'DESCRIPTION': 'Detailed API documentation for the project',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': True,
    'SERVE_PERMISSIONS': [],  # ensure it's publicly accessible
    'DEFAULT_FORMAT': 'json',
    'COMPONENT_SPLIT_REQUEST': True,
    "POSTPROCESSING_HOOKS": [
        "dashboard.hooks.add_timestamp_query_params",
    ],
}

MIDDLEWARE = [
    'access.middleware.RequestLoggingMiddleware',
    'dashboard.middleware.RequestLoggingMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Must come first!
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',  # Now follows after CorsMiddleware
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Can follow here or later if needed
]


STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

ROOT_URLCONF = 'main.urls'

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

WSGI_APPLICATION = 'main.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'postgres'),
        'USER': os.getenv('POSTGRES_USER', 'admin'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'postgres'),
        'HOST': os.getenv('POSTGRES_HOST', 'postgres'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]
# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CELERY_BROKER_CONNECTION_RETRY = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True  # To retain existing behavior
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
CELERY_BEAT_SCHEDULE = {}