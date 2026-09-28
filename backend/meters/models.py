from django.db import models

class MeterType(models.TextChoices):
    ELECTRICITY = 'Electricity', 'Electricity'
    SOLAR = 'Solar', 'Solar'
    WIND = 'Wind', 'Wind'
    GENERATOR = 'Generator', 'Generator'

class MeterUnit(models.TextChoices):
    KWH = 'kWh', 'kWh'
    KW = 'kW', 'kW'

class Meter(models.Model):
    facility = models.ForeignKey('facilities.Facility', on_delete=models.CASCADE, related_name='meters')
    meter_number = models.CharField(max_length=100, unique=True)
    meter_type = models.CharField(max_length=50, choices=MeterType.choices, default=MeterType.ELECTRICITY)
    unit = models.CharField(max_length=20, choices=MeterUnit.choices, default=MeterUnit.KWH)
    installation_date = models.DateField()
    capacity = models.FloatField(help_text='Rated capacity in kW')
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['meter_number']

    def __str__(self):
        return f"{self.meter_number} - {self.facility.name} ({self.meter_type})"
