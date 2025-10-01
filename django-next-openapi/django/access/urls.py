# access/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from access.views import (
    OTPRequestView,
    OTPVerifyView,
    LogoutView,
    TokenRefreshView,
    CurrentUserView,
    GoogleAuthInitView,
    GoogleAuthCallbackView,
)

urlpatterns = [
    path('otp/send/', csrf_exempt(OTPRequestView.as_view()), name='otp-send'),
    path('otp/verify/', csrf_exempt(OTPVerifyView.as_view()), name='otp-verify'),

    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', CurrentUserView.as_view(), name='current-user'),

    # New Google OAuth endpoints:
    path('google/', GoogleAuthInitView.as_view(), name='google-init'),
    path('google/callback/', GoogleAuthCallbackView.as_view(), name='google-callback'),
]
