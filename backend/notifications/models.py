import uuid
from django.db import models
from accounts.models import Vendor


class PushSubscription(models.Model):
    """Stores browser push notification subscriptions for customers."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_local_id = models.CharField(max_length=255)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField()
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('customer_local_id', 'vendor', 'endpoint')

    def __str__(self):
        return f'Push sub for {self.customer_local_id} @ {self.vendor.kitchen_name}'
