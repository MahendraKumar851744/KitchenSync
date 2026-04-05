from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Vendor
from .models import PushSubscription


class PushSubscribeView(APIView):
    """POST /api/notifications/subscribe/ — register a push subscription."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        vendor_qr_id = request.data.get('vendor_qr_id')
        customer_local_id = request.data.get('customer_local_id')
        endpoint = request.data.get('endpoint')
        p256dh = request.data.get('p256dh')
        auth = request.data.get('auth')

        if not all([vendor_qr_id, customer_local_id, endpoint, p256dh, auth]):
            return Response({'detail': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vendor = Vendor.objects.get(unique_qr_id=vendor_qr_id)
        except Vendor.DoesNotExist:
            return Response({'detail': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

        PushSubscription.objects.update_or_create(
            customer_local_id=customer_local_id,
            vendor=vendor,
            endpoint=endpoint,
            defaults={'p256dh': p256dh, 'auth': auth}
        )

        return Response({'detail': 'Subscribed successfully.'}, status=status.HTTP_201_CREATED)
