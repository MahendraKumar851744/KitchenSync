from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # Flatten all errors into a single clean structure
        errors = response.data

        # If it's just a detail string, leave it as-is
        # If it's a dict of field errors, keep it for form validation
        response.data = errors

    return response
