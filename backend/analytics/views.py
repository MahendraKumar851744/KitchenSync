from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Vendor
from orders.models import Order, OrderItem
from menu.models import MenuItem


class VendorAnalyticsView(APIView):
    """GET /api/vendor/analytics/ — dashboard metrics for authenticated vendor."""

    def get(self, request):
        vendor = request.user
        orders = Order.objects.filter(vendor=vendor, payment_status=Order.PaymentStatus.PAID)

        total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders = orders.count()
        today = timezone.localdate()
        today_orders = orders.filter(created_at__date=today).count()
        today_revenue = orders.filter(created_at__date=today).aggregate(total=Sum('total_amount'))['total'] or 0

        top_items = (
            OrderItem.objects
            .filter(order__vendor=vendor, order__payment_status=Order.PaymentStatus.PAID)
            .values('menu_item__name')
            .annotate(total_sold=Sum('quantity'))
            .order_by('-total_sold')[:5]
        )

        return Response({
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'today_orders': today_orders,
            'today_revenue': today_revenue,
            'top_items': list(top_items),
        })


class AdminAnalyticsView(APIView):
    """GET /api/admin/analytics/ — platform-wide stats for admin."""

    def get(self, request):
        if not (request.user.is_authenticated and request.user.is_staff):
            from rest_framework import status
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        orders = Order.objects.filter(payment_status=Order.PaymentStatus.PAID)
        return Response({
            'total_revenue': orders.aggregate(total=Sum('total_amount'))['total'] or 0,
            'total_orders': orders.count(),
            'active_vendors': Vendor.objects.filter(is_approved=True, is_active=True, is_staff=False).count(),
            'pending_vendors': Vendor.objects.filter(is_approved=False, is_staff=False).count(),
        })
