from django.urls import path
from .views import VendorAnalyticsView, AdminAnalyticsView

urlpatterns = [
    path('vendor/analytics/', VendorAnalyticsView.as_view(), name='vendor-analytics'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
]
