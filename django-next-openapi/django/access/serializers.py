# access/serializers.py
from django.contrib.auth.models import Group
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, help_text="The user's username.")
    password = serializers.CharField(required=True, write_only=True, help_text="The user's password.")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'name')

    def create(self, validated_data):
        username = validated_data.get('username')
        email = validated_data.get('email')
        password = validated_data.get('password')
        name = validated_data.get('name', '')
        user = User.objects.create_user(username=username, email=email, password=password, name=name)
        return user

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
        fields = ('id', 'username', 'email', 'name', 'birthday', 'avatar', 'phone', 'groups', 'is_email_verified')
        read_only_fields = fields
