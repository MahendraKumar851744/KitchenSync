from django.urls import path
from .views import PushSubscribeView

urlpatterns = [
    path('notifications/subscribe/', PushSubscribeView.as_view(), name='push-subscribe'),
]
