from rest_framework import serializers
from .models import Order, OrderItem
from menu.serializers import MenuItemSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'item_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    simple_order_id_display = serializers.SerializerMethodField()
    vendor_qr_id = serializers.CharField(source='vendor.unique_qr_id', read_only=True)
    vendor_name = serializers.CharField(source='vendor.kitchen_name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'vendor', 'vendor_qr_id', 'vendor_name', 'customer_local_id',
            'simple_order_id', 'simple_order_id_display', 'total_amount',
            'payment_status', 'order_status', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'simple_order_id', 'created_at', 'updated_at']

    def get_simple_order_id_display(self, obj):
        return f'{obj.simple_order_id:03d}'


class CheckoutItemSerializer(serializers.Serializer):
    menu_item_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    vendor_qr_id = serializers.CharField()
    customer_local_id = serializers.CharField()
    items = CheckoutItemSerializer(many=True)


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['order_status']
