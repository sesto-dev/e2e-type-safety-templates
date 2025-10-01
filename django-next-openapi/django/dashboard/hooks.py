# dashboard/openapi_hooks.py

from copy import deepcopy

TIMESTAMP_FIELDS = ("created_at", "updated_at")
OPS = ("gte", "lte")


def _make_param(name, desc):
    return {
        "name": name,
        "in": "query",
        "required": False,
        "description": desc,
        "schema": {
            "type": "string",
            "format": "date-time",
        },
    }


def add_timestamp_query_params(result, generator, request, public):
    """
    Postprocessing hook for drf-spectacular.
    Inserts created_at__gte, created_at__lte, updated_at__gte, updated_at__lte
    as optional query parameters into all GET operations (if not already present).
    """
    # operate on a shallow copy if you want safety, but here we mutate in-place
    for path, path_item in result.get("paths", {}).items():
        # only modify 'get' operations (list endpoints)
        op = path_item.get("get")
        if not op:
            continue

        # ensure parameters list exists
        params = op.setdefault("parameters", [])

        existing_names = {p.get("name") for p in params if isinstance(p, dict)}

        for field in TIMESTAMP_FIELDS:
            for op_key in OPS:
                name = f"{field}__{op_key}"
                if name in existing_names:
                    continue
                desc = f"Filter by {field} {op_key} (ISO-8601 date/time, e.g. 2024-01-01T00:00:00Z)"
                params.append(_make_param(name, desc))

    return result
