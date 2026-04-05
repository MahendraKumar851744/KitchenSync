from django.contrib import admin
from .models import Category, MenuItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'sort_order']
    list_filter = ['vendor']
    search_fields = ['name', 'vendor__kitchen_name']
    list_editable = ['sort_order']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'category', 'price', 'is_available', 'created_at']
    list_filter = ['is_available', 'vendor', 'category']
    search_fields = ['name', 'vendor__kitchen_name']
    list_editable = ['is_available', 'price']
    ordering = ['vendor', 'category', 'name']
    readonly_fields = ['id', 'created_at']
