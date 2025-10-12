# dashboard/models.py
"""
Fully-refactored models that incorporate all critical fixes
and best-practice suggestions from the previous review.
"""

import uuid
from django.db.models import JSONField
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def generate_cuid() -> str:
    """Return a UUID4 string."""
    return str(uuid.uuid4())


def generate_short_hex() -> str:
    """Return an 8-character hexadecimal identifier (NOT a NanoID)."""
    return uuid.uuid4().hex[:8]

# ------------------------------------------------------------------
# Custom user
# ------------------------------------------------------------------
class CustomUserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username field must be set.")
        email = self.normalize_email(email) if email else None
        username = username.strip()
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(username, email=email, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # New required username field used for authentication
    username = models.CharField(max_length=150, unique=True, blank=False)

    email = models.EmailField(unique=True, blank=False)
    phone = models.CharField(max_length=50, unique=True, null=True, blank=True)
    avatar = models.URLField(null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    birthday = models.DateTimeField(null=True, blank=True)
    otp = models.CharField(max_length=50, null=True, blank=True)
    email_unsubscribe_token = models.CharField(
        max_length=255, unique=True, default=generate_cuid
    )
    referral_code = models.CharField(
        max_length=50, unique=True, default=generate_short_hex
    )

    is_banned = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    is_email_subscribed = models.BooleanField(default=False)
    is_phone_subscribed = models.BooleanField(default=False)

    # Django-admin required
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Use username for authentication now
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    objects = CustomUserManager()

    def __str__(self):
        return self.username or self.email or str(self.id)
