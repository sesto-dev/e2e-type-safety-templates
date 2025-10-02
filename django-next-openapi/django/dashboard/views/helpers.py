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

class IsOrgMemberOrStaff(permissions.BasePermission):
    """
    Allow access if user is staff or a member of the object's organization.
    The view should use this permission together with get_queryset filtering.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user and user.is_authenticated:
            if user.is_staff:
                return True
            # many models have `organization` FK; fall back to candidate/applicant checks handled in viewsets
            org = getattr(obj, "organization", None)
            if org is not None:
                return org in user.organizations.all()
            # no organization: deny by default
        return False


class OrganizationQuerysetMixin:

    org_field = "organization"
    organization_lookup_url_kwarg = "organization_pk"
    organization_model_names = ("organization",)

    def get_queryset(self):
        qs = super().get_queryset()
        request = getattr(self, "request", None)
        user = getattr(request, "user", None)

        # Staff / superuser: full access
        if user and user.is_authenticated and (user.is_staff or user.is_superuser):
            return qs

        # Unauthenticated: no access
        if not user or not user.is_authenticated:
            return qs.none()

        # Build the list of org ids the user belongs to
        # (uses the members M2M relation you already have: user.organizations)
        org_qs = getattr(user, "organizations", None)
        if org_qs is None:
            # If user has no organizations relation, deny access
            return qs.none()

        org_ids = list(org_qs.values_list("id", flat=True))
        if not org_ids:
            return qs.none()

        # 1) If nested route provides organization_pk (rest_framework_nested)
        org_kw = self.kwargs.get(self.organization_lookup_url_kwarg)
        if org_kw is not None:
            # org_kw might be a numeric pk or a slug string. Try integer first.
            try:
                org_id = int(org_kw)
            except (TypeError, ValueError):
                org_id = None

            if org_id is not None:
                # If the user is not a member of this org -> no access
                if org_id not in org_ids:
                    return qs.none()
                # Filter by the FK field referencing the organization
                try:
                    return qs.filter(**{f"{self.org_field}__in": [org_id]})
                except Exception:
                    return qs.none()
            else:
                # treat org_kw as a slug (common pattern)
                if user.organizations.filter(slug=org_kw).exists():
                    try:
                        return qs.filter(**{f"{self.org_field}__slug": org_kw})
                    except Exception:
                        return qs.none()
                return qs.none()

        # 2) If current model *is* Organization, return only user's organizations
        model = getattr(qs, "model", None)
        if model is not None and model._meta.model_name in self.organization_model_names:
            # use pk/id to restrict org list
            try:
                return qs.filter(pk__in=org_ids)
            except Exception:
                return qs.none()

        # 3) Fallback: try filtering by `org_field` (e.g. assessment.organization)
        try:
            return qs.filter(**{f"{self.org_field}__in": org_ids})
        except Exception:
            # Model doesn't have the org_field: return none (safe default)
            return qs.none()