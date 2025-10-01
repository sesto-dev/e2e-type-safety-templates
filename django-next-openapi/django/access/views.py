# access/views.py
import os
import secrets
import logging
import hashlib
import base64
import requests
import random, string

from rest_framework.generics import CreateAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken

from urllib.parse import urlencode

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from django.conf import settings
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from django.utils import timezone

from dashboard.tasks import send_celery_email
from dashboard.models import User
from access.serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    LogoutSerializer,
    TokenRefreshSerializer,
    CurrentUserSerializer
)

logger = logging.getLogger(__name__)

HTTP_COOKIE_SUBDOMAIN = settings.COOKIE_DOMAIN

# ---------------------------------------------------------------------
# Helper function to set authentication cookies in the response.
def set_auth_cookies(response, refresh, domain):
    logger.info(f"setting httpOnly cookies for {domain}")
    print(f"setting httpOnly cookies for {domain}")

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
    )
    response.set_cookie(
        key="refresh_token",
        value=str(refresh),
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        expires=refresh_expires,
        domain=domain,
    )
    return response

# ---------------------------------------------------------------------
# 1. OTP Request Endpoint
class OTPRequestView(CreateAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user, _ = User.objects.get_or_create(email=email)
        otp = ''.join(secrets.choice(string.digits) for _ in range(6))
        user.otp = otp
        user.save()

        send_celery_email(
            subject="Your OTP Code",
            plain_text=f"Your OTP code is: {otp}. Visit {settings.GOOGLE_REDIRECT_DASHBOARD_URI} to access the dashboard.",
            candidate_email=email,
        )
        return Response({"detail": "OTP sent"}, status=status.HTTP_200_OK)

# ---------------------------------------------------------------------
# 2. OTP Verify Endpoint
class OTPVerifyView(GenericAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning("OTP verify failed: user not found for email %s", email)
            return Response({"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST)

        if user.otp != code:
            logger.warning("OTP verify failed: invalid OTP for email %s", email)
            return Response({"detail": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        # Clear OTP and mark as verified
        user.otp = ""
        user.is_email_verified = True
        user.save()

        # Generate JWT tokens using SimpleJWT.
        refresh = RefreshToken.for_user(user)
        response = Response({"detail": "OTP verified"}, status=status.HTTP_200_OK)
        set_auth_cookies(response, refresh, HTTP_COOKIE_SUBDOMAIN)
        logger.info("Set HttpOnly cookies for user %s", user.email)
        return response

# ---------------------------------------------------------------------
# 3. Logout Endpoint
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
# 4. Token Refresh Endpoint
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
# 5. Current User Endpoint
class CurrentUserView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CurrentUserSerializer

    def get_object(self):
        logger.debug("Incoming cookies: %s", self.request.COOKIES)
        return self.request.user

# ---------------------------------------------------------------------
# Google OAuth: Initiation and Callback
class GoogleAuthInitView(GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # Generate a random state and code verifier.
        state = secrets.token_urlsafe(32)
        code_verifier = secrets.token_urlsafe(64)
        # Save these values in the session for later validation.
        request.session['google_oauth_state'] = state
        request.session['google_code_verifier'] = code_verifier

        # Compute the code challenge as base64url( SHA256(code_verifier) )
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).rstrip(b'=').decode('ascii')

        client_id = settings.GOOGLE_CLIENT_ID
        redirect_uri = settings.GOOGLE_REDIRECT_URI  # e.g. "https://yourdomain.com/api/auth/google/callback/"
        scope = "openid email profile"
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": scope,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        url = auth_url + "?" + urlencode(params)
        return redirect(url)

class GoogleAuthCallbackView(GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # Retrieve parameters from the query string.
        code = request.GET.get("code")
        state = request.GET.get("state")
        if not code or not state:
            return Response({"detail": "Missing code or state"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate state against what was stored in the session.
        stored_state = request.session.get('google_oauth_state')
        code_verifier = request.session.get('google_code_verifier')
        if state != stored_state:
            return Response({"detail": "Invalid state parameter"}, status=status.HTTP_400_BAD_REQUEST)

        # Exchange the authorization code for tokens.
        token_url = "https://oauth2.googleapis.com/token"
        client_id = settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_CLIENT_SECRET
        redirect_uri = settings.GOOGLE_REDIRECT_URI
        data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
            "code_verifier": code_verifier,
        }
        token_response = requests.post(token_url, data=data)
        if token_response.status_code != 200:
            return Response({"detail": "Failed to obtain tokens from Google"}, status=status.HTTP_400_BAD_REQUEST)
        token_data = token_response.json()
        id_token_str = token_data.get("id_token")
        if not id_token_str:
            return Response({"detail": "Missing id_token in token response"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the id_token using Google's public keys.
        try:
            req = google_requests.Request()
            id_info = id_token.verify_oauth2_token(id_token_str, req, client_id)
        except Exception as e:
            # Log the exception details for debugging purposes.
            logger.error(f"Failed to verify id token: {e}")
            return Response({"detail": "Failed to verify id token"}, status=status.HTTP_400_BAD_REQUEST)

        # Extract user information from the id token.
        email = id_info.get("email")
        name = id_info.get("name")
        avatar = id_info.get("picture")
        if not email:
            return Response({"detail": "Email not available in token"}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create the user in your database.
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "name": name or "",
                "avatar": avatar or "",
                "is_email_verified": True,
            }
        )
        if not created:
            # Update only if the fields are empty.
            if not user.name and name:
                user.name = name
            if not user.avatar and avatar:
                user.avatar = avatar
            # You can still mark the email as verified if needed.
            user.is_email_verified = True
            user.save()

        # Generate JWT tokens using SimpleJWT.
        refresh = RefreshToken.for_user(user)
        
        # Determine the Next.js dashboard URL from settings or fallback.
        dashboard_url = getattr(settings, "GOOGLE_REDIRECT_DASHBOARD_URI")
        response = HttpResponseRedirect(dashboard_url)
        set_auth_cookies(response, refresh, HTTP_COOKIE_SUBDOMAIN)

        # Clean up session variables.
        try:
            del request.session['google_oauth_state']
            del request.session['google_code_verifier']
        except KeyError:
            pass

        return response
