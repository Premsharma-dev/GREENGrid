from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    MANAGER = 'MANAGER', 'Facility Manager'
    VIEWER = 'VIEWER', 'Viewer'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.VIEWER,
        help_text='Role governing platform permissions'
    )
    email = models.EmailField(unique=True)
    assigned_facility = models.ForeignKey(
        'facilities.Facility',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_users'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def is_admin(self):
        return self.role == UserRole.ADMIN or self.is_superuser

    def is_facility_manager(self):
        return self.role == UserRole.MANAGER

    def is_viewer(self):
        return self.role == UserRole.VIEWER

    def __str__(self):
        return f"{self.username} ({self.role})"
