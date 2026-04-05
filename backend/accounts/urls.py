from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    VendorRegisterView,
    VendorLoginView,
    VendorProfileView,
    VendorQRCodeView,
    AdminPendingVendorsView,
    AdminApproveVendorView,
)

urlpatterns = [
    path('vendors/register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('vendor/login/', VendorLoginView.as_view(), name='vendor-login'),
    path('vendor/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('vendor/profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('vendor/qrcode/', VendorQRCodeView.as_view(), name='vendor-qrcode'),
    path('admin/vendors/pending/', AdminPendingVendorsView.as_view(), name='admin-pending-vendors'),
    path('admin/vendors/<uuid:pk>/approve/', AdminApproveVendorView.as_view(), name='admin-approve-vendor'),
]
