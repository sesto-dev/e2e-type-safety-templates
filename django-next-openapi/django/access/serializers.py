# access/serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers

User = get_user_model()

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name')

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, help_text="User email")
    password = serializers.CharField(required=True, write_only=True, help_text="Password")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'name')

    def create(self, validated_data):
        email = validated_data.get('email')
        password = validated_data.get('password')
        name = validated_data.get('name', "")
        user = User.objects.create_user(email=email, password=password, name=name)
        # Optionally mark email verified or send verification email
        return user

class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(required=True)

class TokenRefreshSerializer(serializers.Serializer):
    pass

class CurrentUserSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'birthday', 'avatar', 'phone', 'groups', 'is_email_verified')
        read_only_fields = fields
