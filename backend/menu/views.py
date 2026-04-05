from rest_framework import generics, permissions
from .models import MenuItem
from .serializers import MenuItemSerializer


class MenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer

    def get_queryset(self):
        return MenuItem.objects.filter(vendor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user)


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MenuItemSerializer

    def get_queryset(self):
        return MenuItem.objects.filter(vendor=self.request.user)
