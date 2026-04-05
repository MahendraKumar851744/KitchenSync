from rest_framework import serializers
from .models import Category, MenuItem


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'sort_order', 'item_count']
        read_only_fields = ['id']


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'price', 'image', 'is_available', 'category', 'category_name', 'created_at']
        read_only_fields = ['id', 'created_at']
