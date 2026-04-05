import uuid
import random
import string
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class VendorManager(BaseUserManager):
    def create_user(self, mobile_number, password=None, **extra_fields):
        if not mobile_number:
            raise ValueError('Mobile number is required')
        vendor = self.model(mobile_number=mobile_number, **extra_fields)
        vendor.set_password(password)
        vendor.save(using=self._db)
        return vendor

    def create_superuser(self, mobile_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_approved', True)
        return self.create_user(mobile_number, password, **extra_fields)


def generate_unique_qr_id():
    chars = string.ascii_uppercase + string.digits
    while True:
        code = 'KS' + ''.join(random.choices(chars, k=3))
        if not Vendor.objects.filter(unique_qr_id=code).exists():
            return code


class Vendor(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    kitchen_name = models.CharField(max_length=255)
    mobile_number = models.CharField(max_length=15, unique=True)
    address = models.TextField()
    kitchen_logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    unique_qr_id = models.CharField(max_length=10, unique=True, blank=True)
    is_approved = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = VendorManager()

    USERNAME_FIELD = 'mobile_number'
    REQUIRED_FIELDS = ['name', 'kitchen_name']

    def save(self, *args, **kwargs):
        if not self.unique_qr_id:
            self.unique_qr_id = generate_unique_qr_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.kitchen_name} ({self.mobile_number})'

    class Meta:
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
