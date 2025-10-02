# dashboard/serializers/general.py
from django.contrib.auth import get_user_model
from rest_framework import serializers

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