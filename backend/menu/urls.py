from django.urls import path
from .views import CategoryListCreateView, CategoryDetailView, MenuItemListCreateView, MenuItemDetailView

urlpatterns = [
    path('vendor/categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('vendor/categories/<uuid:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    path('vendor/menu/', MenuItemListCreateView.as_view(), name='menu-list-create'),
    path('vendor/menu/<uuid:pk>/', MenuItemDetailView.as_view(), name='menu-detail'),
]
