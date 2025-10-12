# access/views.py (relevant sections)
from rest_framework.generics import CreateAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from django.utils import timezone
import logging

from dashboard.models import User
from access.serializers import (
    LoginSerializer,
    RegisterSerializer,
    LogoutSerializer,
    TokenRefreshSerializer,
    CurrentUserSerializer
)

logger = logging.getLogger(__name__)
HTTP_COOKIE_SUBDOMAIN = settings.COOKIE_DOMAIN

def set_auth_cookies(response, refresh, domain):
    access_expires = timezone.now() + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_expires = timezone.now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
    response.set_cookie(
        key="access_token",
        value=str(refresh.access_token),
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        expires=access_expires,
        domain=domain,
        path='/',
    )
    response.set_cookie(
        key="refresh_token",
        value=str(refresh),
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        expires=refresh_expires,
        domain=domain,
        path='/',
    )
    return response

class RegisterView(CreateAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Optionally auto-login: issue tokens and set cookies
        refresh = RefreshToken.for_user(user)
        response = Response({"detail": "User created"}, status=status.HTTP_201_CREATED)
        set_auth_cookies(response, refresh, HTTP_COOKIE_SUBDOMAIN)
        return response

class LoginView(GenericAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # authenticate uses the model's USERNAME_FIELD; pass email as username
        user = authenticate(request, username=email, password=password)
        if user is None:
            logger.warning("Login failed for email %s", email)
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({"detail": "User is inactive"}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        response = Response({"detail": "Login successful"}, status=status.HTTP_200_OK)
        set_auth_cookies(response, refresh, HTTP_COOKIE_SUBDOMAIN)
        return response


# ---------------------------------------------------------------------
# Logout Endpoint (unchanged)
class LogoutView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')  # Get token from cookies

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                logger.error(e)

        response = Response(status=status.HTTP_205_RESET_CONTENT)
        response.delete_cookie('access_token', path='/', domain=HTTP_COOKIE_SUBDOMAIN)
        response.delete_cookie('refresh_token', path='/', domain=HTTP_COOKIE_SUBDOMAIN)
        return response

# ---------------------------------------------------------------------
# Token Refresh Endpoint (unchanged; uses cookie-based refresh)
class TokenRefreshView(GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        # Always read refresh token from cookies
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response({"detail": "Refresh token not found in cookies"},
                            status=status.HTTP_401_UNAUTHORIZED)

        try:
            old_refresh = RefreshToken(refresh_token)
            old_refresh.blacklist()  # Blacklist old token (rotation)

            # Get user from token payload
            user_id = old_refresh.payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token payload"},
                                status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"detail": "User not found"},
                                status=status.HTTP_400_BAD_REQUEST)

            # Issue a new refresh token
            new_refresh = RefreshToken.for_user(user)

            response = Response({"detail": "Token refreshed"},
                                status=status.HTTP_200_OK)
            set_auth_cookies(response, new_refresh, HTTP_COOKIE_SUBDOMAIN)
            return response

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
# ---------------------------------------------------------------------
# Current User Endpoint
class CurrentUserView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CurrentUserSerializer

    def get_object(self):
        logger.debug("Incoming cookies: %s", self.request.COOKIES)
        return self.request.user