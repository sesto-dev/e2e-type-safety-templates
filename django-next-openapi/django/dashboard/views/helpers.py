# dashboard/api_permissions.py
from django.db.models import Q
from rest_framework import viewsets, permissions
from dashboard import models

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters as drf_filters

class AuthenticatedViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]


class OwnedObjectMixin:
    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(user=self.request.user)