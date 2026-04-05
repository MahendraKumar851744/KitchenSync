from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Category, MenuItem
from .serializers import CategorySerializer, MenuItemSerializer


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(vendor=self.request.user).annotate(item_count=Count('items'))

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(vendor=self.request.user).annotate(item_count=Count('items'))


class MenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer

    def get_queryset(self):
        return MenuItem.objects.filter(vendor=self.request.user).select_related('category')

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user)


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MenuItemSerializer

    def get_queryset(self):
        return MenuItem.objects.filter(vendor=self.request.user).select_related('category')
