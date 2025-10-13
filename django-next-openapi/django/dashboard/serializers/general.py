# dashboard/serializers/general.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from dashboard.models import Todo

User = get_user_model()

class TimestampedModelSerializer(serializers.ModelSerializer):
    """Provides common read_only_fields for timestamp fields."""
    class Meta:
        abstract = True
        read_only_fields = ("created_at", "updated_at")

class UserSerializer(TimestampedModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "avatar", "name", "phone", "birthday", "is_active",
                  "is_staff", "is_email_verified", "is_phone_verified",
                  "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")


class TodoSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = Todo
        fields = ("id", "owner", "owner_email", "title", "description", "is_complete", "created_at", "updated_at")
        read_only_fields = ("id", "owner", "owner_email", "created_at", "updated_at")   