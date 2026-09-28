from django.db import models

class BuildingType(models.TextChoices):
    OFFICE = 'Office', 'Office'
    COLLEGE = 'College', 'College'
    HOSPITAL = 'Hospital', 'Hospital'
    FACTORY = 'Factory', 'Factory'
    WAREHOUSE = 'Warehouse', 'Warehouse'
    RESIDENTIAL = 'Residential', 'Residential'
    OTHER = 'Other', 'Other'

class FacilityStatus(models.TextChoices):
    ACTIVE = 'Active', 'Active'
    INACTIVE = 'Inactive', 'Inactive'

class Facility(models.Model):
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=255)
    building_type = models.CharField(max_length=50, choices=BuildingType.choices, default=BuildingType.OFFICE)
    area = models.FloatField(help_text='Floor area in square meters / square feet')
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=FacilityStatus.choices, default=FacilityStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Facilities'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.building_type})"
