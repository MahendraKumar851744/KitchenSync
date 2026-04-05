from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ['id', 'menu_item', 'quantity', 'item_price']
    extra = 0
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['simple_order_id_display', 'vendor', 'total_amount', 'payment_status', 'order_status', 'created_at']
    list_filter = ['order_status', 'payment_status', 'vendor']
    search_fields = ['vendor__kitchen_name', 'customer_local_id', 'payment_id']
    readonly_fields = ['id', 'vendor', 'customer_local_id', 'simple_order_id', 'total_amount', 'payment_id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    inlines = [OrderItemInline]

    def simple_order_id_display(self, obj):
        return f'#{obj.simple_order_id:03d}'
    simple_order_id_display.short_description = 'Order #'
