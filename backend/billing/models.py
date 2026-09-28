from django.db import models

class Tariff(models.Model):
    name = models.CharField(max_length=150)
    rate_per_kwh = models.FloatField(help_text='Rate charged per kilowatt-hour')
    fixed_charge = models.FloatField(default=0, help_text='Monthly fixed service fee')
    tax_percentage = models.FloatField(default=12.0, help_text='Government tax / cess percentage')
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} (₹{self.rate_per_kwh}/kWh)"

class PaymentStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    PAID = 'Paid', 'Paid'
    OVERDUE = 'Overdue', 'Overdue'

class Bill(models.Model):
    facility = models.ForeignKey('facilities.Facility', on_delete=models.CASCADE, related_name='bills')
    billing_month = models.CharField(max_length=7, help_text='Format: YYYY-MM')
    units_consumed = models.FloatField()
    rate_per_kwh = models.FloatField()
    energy_charge = models.FloatField()
    fixed_charge = models.FloatField()
    tax = models.FloatField()
    total_amount = models.FloatField()
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    generated_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-billing_month']
        unique_together = ('facility', 'billing_month')

    def __str__(self):
        return f"{self.facility.name} - {self.billing_month} (₹{self.total_amount})"
