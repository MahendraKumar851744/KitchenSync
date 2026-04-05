from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def handler404(request, exception=None):
    return JsonResponse({'detail': 'Not found.'}, status=404)


def handler500(request):
    return JsonResponse({'detail': 'Server error.'}, status=500)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('menu.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('analytics.urls')),
    path('api/', include('notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
