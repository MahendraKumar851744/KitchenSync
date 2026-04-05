from django.contrib import admin
from .models import PushSubscription


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['customer_local_id', 'vendor', 'created_at']
    list_filter = ['vendor']
    search_fields = ['customer_local_id', 'vendor__kitchen_name']
    readonly_fields = ['id', 'customer_local_id', 'vendor', 'endpoint', 'p256dh', 'auth', 'created_at']
    ordering = ['-created_at']
