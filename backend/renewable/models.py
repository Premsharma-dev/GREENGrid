from django.db import models

class RenewableSourceType(models.TextChoices):
    SOLAR = 'Solar', 'Solar'
    WIND = 'Wind', 'Wind'
    OTHER = 'Other Renewable', 'Other Renewable'

class RenewableGeneration(models.Model):
    facility = models.ForeignKey('facilities.Facility', on_delete=models.CASCADE, related_name='renewable_generation')
    source_type = models.CharField(max_length=50, choices=RenewableSourceType.choices, default=RenewableSourceType.SOLAR)
    generation_date = models.DateField()
    energy_generated = models.FloatField(help_text='Energy generated in kWh')
    capacity = models.FloatField(help_text='Installed solar/wind capacity in kW')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generation_date']

    def __str__(self):
        return f"{self.facility.name} - {self.source_type} ({self.generation_date}): {self.energy_generated} kWh"
