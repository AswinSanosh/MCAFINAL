from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that does not enforce CSRF validation.
    Use this for API endpoints where CSRF is handled differently.
    """
    def enforce_csrf(self, request):
        # Do not enforce CSRF check
        return
