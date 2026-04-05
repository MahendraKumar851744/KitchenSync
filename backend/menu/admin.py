from django.contrib import admin
from .models import MenuItem


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'price', 'is_available', 'created_at']
    list_filter = ['is_available', 'vendor']
    search_fields = ['name', 'vendor__kitchen_name']
    list_editable = ['is_available', 'price']
    ordering = ['vendor', 'name']
    readonly_fields = ['id', 'created_at']
