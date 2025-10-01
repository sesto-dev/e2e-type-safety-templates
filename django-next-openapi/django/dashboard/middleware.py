import logging
import json
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("dashboard")

class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Skip logging for admin/static
        if request.path.startswith("/admin") or request.path.startswith("/static"):
            return None

        try:
            body = request.body.decode("utf-8")
            data = json.loads(body) if body else {}
        except Exception:
            data = request.body.decode("utf-8", errors="ignore")

        logger.info(
            f"REQUEST: {request.method} {request.path} "
            f"QUERY: {dict(request.GET)} "
            f"BODY: {data}"
        )

    def process_response(self, request, response):
        # Skip logging for admin/static
        if request.path.startswith("/admin") or request.path.startswith("/static"):
            return response

        try:
            resp_data = (
                response.data if hasattr(response, "data") else str(response.content[:500])
            )
        except Exception:
            resp_data = str(response)

        logger.info(
            f"RESPONSE: {request.method} {request.path} "
            f"STATUS: {response.status_code} "
            f"BODY: {resp_data}"
        )
        return response
