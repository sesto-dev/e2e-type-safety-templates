# access/serializers.py
from django.contrib.auth.models import Group
from rest_framework import serializers

from dashboard.models import User

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name')

class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        help_text="The email address to which the OTP will be sent."
    )

class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        help_text="The user's email address."
    )
    code = serializers.CharField(
        required=True,
        max_length=6,
        help_text="The 6-digit OTP code received by email."
    )

class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(
        required=True,
        help_text="The refresh token to be blacklisted upon logout."
    )

class TokenRefreshSerializer(serializers.Serializer):
    pass

class CurrentUserSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'birthday', 'avatar', 'phone', 'groups', 'is_email_verified')
        read_only_fields = fields
