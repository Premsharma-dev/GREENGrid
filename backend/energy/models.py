from django.db import models
from django.core.exceptions import ValidationError

class EnergyReading(models.Model):
    meter = models.ForeignKey('meters.Meter', on_delete=models.CASCADE, related_name='readings')
    reading_date = models.DateField()
    meter_reading = models.FloatField(help_text='Cumulative meter reading in kWh')
    consumption = models.FloatField(default=0, help_text='Calculated incremental consumption (Current - Previous)')
    peak_consumption = models.FloatField(default=0)
    off_peak_consumption = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-reading_date', '-created_at']
        unique_together = ('meter', 'reading_date')

    def clean(self):
        # Look up previous reading
        prev = EnergyReading.objects.filter(
            meter=self.meter,
            reading_date__lt=self.reading_date
        ).order_by('-reading_date').first()

        if prev and self.meter_reading < prev.meter_reading:
            raise ValidationError(
                f"Meter reading ({self.meter_reading}) cannot be less than previous reading "
                f"({prev.meter_reading}) on {prev.reading_date}."
            )

    def save(self, *args, **kwargs):
        prev = EnergyReading.objects.filter(
            meter=self.meter,
            reading_date__lt=self.reading_date
        ).order_by('-reading_date').first()

        if prev:
            self.consumption = max(0.0, self.meter_reading - prev.meter_reading)
        else:
            self.consumption = 0.0

        # Estimate peak and off-peak distribution (standard 65/35 daytime split)
        self.peak_consumption = round(self.consumption * 0.65, 2)
        self.off_peak_consumption = round(self.consumption * 0.35, 2)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.meter.meter_number} - {self.reading_date}: {self.consumption} kWh"
