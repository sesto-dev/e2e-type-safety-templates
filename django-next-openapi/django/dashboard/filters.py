# dashboard/filters.py
from typing import List
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.filters import BaseFilterBackend
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes

DATETIME_OPS = ("gte", "lte")
TIMESTAMP_FIELDS = ("created_at", "updated_at")

def _parse_datetime(value):
    """
    Accept ISO-8601 strings. Return an aware datetime when possible,
    otherwise return the original string (let the ORM raise/handle).
    """
    dt = parse_datetime(value)
    if not dt:
        return value
    if timezone.is_naive(dt):
        # assume UTC for naive values — adjust if your project uses a different default
        dt = timezone.make_aware(dt, timezone.utc)
    return dt


class TimestampFilterBackend(BaseFilterBackend):
    """
    Global filter backend that:
    - supports query params:
        created_at__gte, created_at__lte,
        updated_at__gte, updated_at__lte
      (ISO-8601 date/time strings)
    - applies them to queryset
    - exposes OpenAPI params to drf-spectacular automatically
    """

    def filter_queryset(self, request, queryset, view):
        q = queryset
        params = request.query_params

        for field in TIMESTAMP_FIELDS:
            for op in DATETIME_OPS:
                key = f"{field}__{op}"
                if key in params:
                    value = params.get(key)
                    parsed = _parse_datetime(value)
                    # apply filter; if parsed is a string and invalid, ORM may raise — that's fine
                    q = q.filter(**{key: parsed})

        return q

    def get_schema_operation_parameters(self, view) -> List[dict]:
        """
        Return OpenAPI-style parameter dicts for drf-spectacular.
        Some drf-spectacular versions expect plain dicts (not OpenApiParameter instances).
        """
        # try to discover the model from view.queryset or serializer_class.Meta.model
        model = None
        queryset = getattr(view, "queryset", None)
        if queryset is not None:
            model = getattr(queryset, "model", None)

        if model is None:
            serializer_class = getattr(view, "serializer_class", None)
            if serializer_class is not None:
                model = getattr(getattr(serializer_class, "Meta", None), "model", None)

        params = []
        if model is None:
            model_fields_available = {f for f in TIMESTAMP_FIELDS}
        else:
            model_fields_available = {
                f.name for f in model._meta.get_fields() if f.name in TIMESTAMP_FIELDS
            }

        for field in model_fields_available:
            for op in DATETIME_OPS:
                name = f"{field}__{op}"
                params.append(
                    {
                        "name": name,
                        "in": "query",
                        "required": False,
                        "schema": {"type": "string", "format": "date-time"},
                        "description": (
                            f"Filter by {field} {op.upper()} (ISO-8601). "
                            "Examples: 2024-01-01T00:00:00Z or 2024-01-01"
                        ),
                    }
                )

        return params
