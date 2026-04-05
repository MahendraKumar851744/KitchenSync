from rest_framework import serializers
from .models import Vendor


class VendorRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Vendor
        fields = ['name', 'kitchen_name', 'mobile_number', 'password', 'address', 'kitchen_logo']

    def create(self, validated_data):
        password = validated_data.pop('password')
        vendor = Vendor(**validated_data)
        vendor.set_password(password)
        vendor.save()
        return vendor


class VendorPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['id', 'kitchen_name', 'kitchen_logo', 'address', 'is_active', 'unique_qr_id']


class VendorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['id', 'name', 'kitchen_name', 'mobile_number', 'address', 'kitchen_logo',
                  'unique_qr_id', 'is_approved', 'is_active', 'created_at']
        read_only_fields = ['id', 'mobile_number', 'unique_qr_id', 'is_approved', 'created_at']


class AdminVendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['id', 'name', 'kitchen_name', 'mobile_number', 'address', 'kitchen_logo',
                  'unique_qr_id', 'is_approved', 'is_active', 'created_at']
        read_only_fields = ['id', 'mobile_number', 'unique_qr_id', 'created_at']
