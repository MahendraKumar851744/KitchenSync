from django.urls import path
from .views import MenuItemListCreateView, MenuItemDetailView

urlpatterns = [
    path('vendor/menu/', MenuItemListCreateView.as_view(), name='menu-list-create'),
    path('vendor/menu/<uuid:pk>/', MenuItemDetailView.as_view(), name='menu-detail'),
]
