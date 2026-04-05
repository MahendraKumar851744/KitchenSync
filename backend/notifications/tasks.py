import json
from django.conf import settings
from pywebpush import webpush, WebPushException
from .models import PushSubscription


def send_order_notification(order):
    """Send Web Push notifications to customer when order status changes."""
    subscriptions = PushSubscription.objects.filter(
        customer_local_id=order.customer_local_id,
        vendor=order.vendor
    )
    if not subscriptions.exists():
        return

    status_messages = {
        'ACCEPTED': ('Order Accepted!', f'Your order #{order.simple_order_id:03d} is being prepared.'),
        'READY':    ('Order Ready!',    f'Order #{order.simple_order_id:03d} is ready for pickup!'),
        'CANCELLED':('Order Cancelled', f'Order #{order.simple_order_id:03d} has been cancelled.'),
    }
    message = status_messages.get(order.order_status)
    if not message:
        return

    title, body = message
    payload = json.dumps({'title': title, 'body': body, 'order_id': str(order.id)})

    vapid_private = settings.VAPID_PRIVATE_KEY
    vapid_claims = {'sub': f'mailto:{settings.VAPID_ADMIN_EMAIL}'}

    if not vapid_private:
        return

    stale = []
    for sub in subscriptions:
        subscription_info = {
            'endpoint': sub.endpoint,
            'keys': {'p256dh': sub.p256dh, 'auth': sub.auth},
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims=vapid_claims,
            )
        except WebPushException as e:
            # 410 Gone = subscription expired, clean it up
            if e.response and e.response.status_code == 410:
                stale.append(sub.id)

    if stale:
        PushSubscription.objects.filter(id__in=stale).delete()
