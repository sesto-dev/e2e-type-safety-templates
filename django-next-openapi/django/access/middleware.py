# access/middleware.py
import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        logger.info("Request Headers: %s", request.headers)
        logger.info("Request Cookies: %s", request.COOKIES)
        return self.get_response(request)
