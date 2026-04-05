from django.urls import path
from .views import (
    CustomerMenuView,
    CheckoutCreateView,
    CheckoutVerifyView,
    CustomerOrdersView,
    VendorOrderListView,
    VendorOrderStatusUpdateView,
)

urlpatterns = [
    path('v/<str:unique_qr_id>/', CustomerMenuView.as_view(), name='customer-menu'),
    path('checkout/', CheckoutCreateView.as_view(), name='checkout-create'),
    path('checkout/verify/', CheckoutVerifyView.as_view(), name='checkout-verify'),
    path('orders/customer/<str:local_id>/', CustomerOrdersView.as_view(), name='customer-orders'),
    path('vendor/orders/', VendorOrderListView.as_view(), name='vendor-orders'),
    path('vendor/orders/<uuid:pk>/status/', VendorOrderStatusUpdateView.as_view(), name='vendor-order-status'),
]
