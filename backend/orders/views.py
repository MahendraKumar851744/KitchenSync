from django.db import transaction
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Vendor
from menu.models import MenuItem
from notifications.tasks import send_order_notification
from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    CheckoutSerializer,
    OrderStatusUpdateSerializer,
)


class CustomerMenuView(APIView):
    """GET /api/v/{unique_qr_id}/ — public endpoint for customers."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, unique_qr_id):
        try:
            vendor = Vendor.objects.get(unique_qr_id=unique_qr_id, is_approved=True)
        except Vendor.DoesNotExist:
            return Response({'detail': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

        from accounts.serializers import VendorPublicSerializer
        from menu.models import Category
        from menu.serializers import MenuItemSerializer

        menu_items = vendor.menu_items.filter(is_available=True).select_related('category')

        # Group by category
        categories = []
        cat_map = {}
        uncategorized = []

        for item in menu_items:
            item_data = MenuItemSerializer(item).data
            if item.category:
                cid = str(item.category.id)
                if cid not in cat_map:
                    cat_map[cid] = {'id': cid, 'name': item.category.name, 'sort_order': item.category.sort_order, 'items': []}
                cat_map[cid]['items'].append(item_data)
            else:
                uncategorized.append(item_data)

        categories = sorted(cat_map.values(), key=lambda c: (c['sort_order'], c['name']))
        if uncategorized:
            categories.append({'id': None, 'name': 'Other', 'sort_order': 9999, 'items': uncategorized})

        return Response({
            'vendor': VendorPublicSerializer(vendor).data,
            'categories': categories,
        })


class CheckoutCreateView(APIView):
    """POST /api/checkout/ — place order directly (payment bypassed for now)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            vendor = Vendor.objects.get(unique_qr_id=data['vendor_qr_id'], is_approved=True)
        except Vendor.DoesNotExist:
            return Response({'detail': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

        total = 0
        line_items = []
        for item_data in data['items']:
            try:
                menu_item = MenuItem.objects.get(id=item_data['menu_item_id'], vendor=vendor, is_available=True)
            except MenuItem.DoesNotExist:
                return Response(
                    {'detail': f'Menu item {item_data["menu_item_id"]} not available.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            total += menu_item.price * item_data['quantity']
            line_items.append({'menu_item': menu_item, 'quantity': item_data['quantity'], 'price': menu_item.price})

        with transaction.atomic():
            order = Order.objects.create(
                vendor=vendor,
                customer_local_id=data['customer_local_id'],
                total_amount=total,
                payment_id='BYPASS',
                payment_status=Order.PaymentStatus.PAID,
                order_status=Order.OrderStatus.RECEIVED,
            )
            for item in line_items:
                OrderItem.objects.create(
                    order=order,
                    menu_item=item['menu_item'],
                    quantity=item['quantity'],
                    item_price=item['price'],
                )

        return Response({
            'order_id': str(order.id),
            'simple_order_id': f'{order.simple_order_id:03d}',
        }, status=status.HTTP_201_CREATED)


class CheckoutVerifyView(APIView):
    """Placeholder — not used while payment is bypassed."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return Response({'detail': 'Not used.'}, status=status.HTTP_400_BAD_REQUEST)


class CustomerOrdersView(generics.ListAPIView):
    """GET /api/orders/customer/{local_id}/ — list all orders for a device."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        local_id = self.kwargs['local_id']
        return Order.objects.filter(customer_local_id=local_id).select_related('vendor')


class VendorOrderListView(generics.ListAPIView):
    """GET /api/vendor/orders/ — live orders for vendor."""
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(
            vendor=self.request.user,
            order_status__in=[
                Order.OrderStatus.RECEIVED,
                Order.OrderStatus.ACCEPTED,
                Order.OrderStatus.READY,
            ]
        ).prefetch_related('items__menu_item')


class VendorOrderStatusUpdateView(APIView):
    """PATCH /api/vendor/orders/{id}/status/ — change order status."""

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, vendor=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Trigger push notification on status change
        send_order_notification(order)

        return Response(OrderSerializer(order).data)
