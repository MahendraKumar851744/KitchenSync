from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Vendor


@admin.register(Vendor)
class VendorAdmin(UserAdmin):
    list_display = ['kitchen_name', 'name', 'mobile_number', 'is_approved', 'is_active', 'created_at']
    list_filter = ['is_approved', 'is_active', 'is_staff']
    search_fields = ['kitchen_name', 'name', 'mobile_number']
    ordering = ['-created_at']
    readonly_fields = ['unique_qr_id', 'created_at']
    actions = ['approve_vendors']

    fieldsets = (
        (None, {'fields': ('mobile_number', 'password')}),
        ('Personal Info', {'fields': ('name', 'kitchen_name', 'address', 'kitchen_logo')}),
        ('Status', {'fields': ('unique_qr_id', 'is_approved', 'is_active')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('created_at',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('mobile_number', 'name', 'kitchen_name', 'address', 'password1', 'password2'),
        }),
    )

    def approve_vendors(self, request, queryset):
        queryset.update(is_approved=True)
    approve_vendors.short_description = 'Approve selected vendors'
