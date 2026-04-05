import uuid
from django.db import models
from django.utils import timezone
from accounts.models import Vendor
from menu.models import MenuItem


class Order(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'

    class OrderStatus(models.TextChoices):
        RECEIVED = 'RECEIVED', 'Received'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        READY = 'READY', 'Ready'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='orders')
    customer_local_id = models.CharField(max_length=255)
    simple_order_id = models.PositiveIntegerField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_id = models.CharField(max_length=255, blank=True)
    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    order_status = models.CharField(
        max_length=10,
        choices=OrderStatus.choices,
        default=OrderStatus.RECEIVED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.simple_order_id:
            self.simple_order_id = self._generate_simple_order_id()
        super().save(*args, **kwargs)

    def _generate_simple_order_id(self):
        today = timezone.localdate()
        last_order = (
            Order.objects
            .filter(vendor=self.vendor, created_at__date=today)
            .order_by('-simple_order_id')
            .first()
        )
        return (last_order.simple_order_id + 1) if last_order else 1

    def __str__(self):
        return f'Order #{self.simple_order_id:03d} - {self.vendor.kitchen_name}'

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    item_price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f'{self.quantity}x {self.menu_item.name if self.menu_item else "Deleted Item"}'
