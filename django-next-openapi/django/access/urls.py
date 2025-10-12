# access/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from access.views import (
    LoginView,
    RegisterView,
    LogoutView,
    TokenRefreshView,
    CurrentUserView,
)

urlpatterns = [
    path('login/', csrf_exempt(LoginView.as_view()), name='login'),
    path('register/', csrf_exempt(RegisterView.as_view()), name='register'),

    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]
