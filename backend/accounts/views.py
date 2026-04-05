import qrcode
import io
from django.http import HttpResponse
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Vendor
from .serializers import (
    VendorRegistrationSerializer,
    VendorProfileSerializer,
    AdminVendorSerializer,
)


class VendorRegisterView(generics.CreateAPIView):
    serializer_class = VendorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'detail': 'Registration successful. Awaiting admin approval.'},
            status=status.HTTP_201_CREATED
        )


class VendorLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        mobile_number = request.data.get('mobile_number')
        password = request.data.get('password')

        try:
            vendor = Vendor.objects.get(mobile_number=mobile_number)
        except Vendor.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not vendor.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not vendor.is_approved:
            return Response(
                {'detail': 'Your account is pending admin approval.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(vendor)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'vendor': VendorProfileSerializer(vendor).data,
        })


class VendorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = VendorProfileSerializer

    def get_object(self):
        return self.request.user


class VendorQRCodeView(APIView):
    def get(self, request):
        vendor = request.user
        url = f'https://yourwebsite.com/v/{vendor.unique_qr_id}'
        img = qrcode.make(url)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return HttpResponse(buf, content_type='image/png')


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff


class AdminPendingVendorsView(generics.ListAPIView):
    serializer_class = AdminVendorSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Vendor.objects.filter(is_approved=False, is_staff=False)


class AdminApproveVendorView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            vendor = Vendor.objects.get(pk=pk, is_staff=False)
        except Vendor.DoesNotExist:
            return Response({'detail': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

        vendor.is_approved = True
        vendor.save()
        return Response({'detail': f'{vendor.kitchen_name} approved successfully.'})
