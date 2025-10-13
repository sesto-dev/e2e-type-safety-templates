# dashboard/views/general.py

import logging
import secrets
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from dashboard.models import Todo

from drf_spectacular.utils import extend_schema, OpenApiResponse

from dashboard.views.helpers import AuthenticatedViewSet
from dashboard.serializers import general as serializers
 
logger = logging.getLogger(__name__)

User = get_user_model()

def get_by_query_or_400(request, model, param_map: dict):
    kwargs = {}
    for qparam, lookup in param_map.items():
        val = request.query_params.get(qparam)
        if not val:
            raise ValidationError(f"Query parameter '{qparam}' is required.")
        # if lookup expects case-insensitive email e.g. 'email__iexact', pass that string directly
        kwargs[lookup] = val
    return get_object_or_404(model, **kwargs)

class UserViewSet(AuthenticatedViewSet):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer
    filterset_fields = ["id", "email", "name", "phone", "birthday", "created_at", "updated_at"]

    def get_object(self):
        # Always operate on the authenticated user for /users/me style endpoints
        return self.request.user
    

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class TodoListCreateView(generics.ListCreateAPIView):
    serializer_class = serializers.TodoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return todos for the authenticated user
        return Todo.objects.filter(owner=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class TodoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = serializers.TodoSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    lookup_field = "id"
    queryset = Todo.objects.all()

    def get_object(self):
        obj = super().get_object()
        # IsOwner permission will check ownership; raise PermissionDenied for clarity
        if obj.owner != self.request.user:
            raise PermissionDenied("You do not have permission to access this Todo.")
        return obj