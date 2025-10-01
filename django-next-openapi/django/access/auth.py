# access/auth.py
from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # First, try to get the token from the Authorization header.
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            # Fall back to the cookie if the header is absent.
            raw_token = request.COOKIES.get('access_token')
        
        if raw_token is None:
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
        except Exception:
            return None
        
        return self.get_user(validated_token), validated_token
