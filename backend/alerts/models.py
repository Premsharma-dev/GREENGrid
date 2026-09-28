from django.db import models

class AlertType(models.TextChoices):
    HIGH_CONSUMPTION = 'HIGH_CONSUMPTION', 'High Consumption'
    UNUSUAL_NIGHT_USAGE = 'UNUSUAL_NIGHT_USAGE', 'Unusual Night Usage'
    RENEWABLE_DROP = 'RENEWABLE_DROP', 'Renewable Generation Drop'
    HIGH_MONTHLY_COST = 'HIGH_MONTHLY_COST', 'High Monthly Cost'
    METER_ANOMALY = 'METER_ANOMALY', 'Meter Anomaly'

class AlertSeverity(models.TextChoices):
    LOW = 'Low', 'Low'
    MEDIUM = 'Medium', 'Medium'
    HIGH = 'High', 'High'
    CRITICAL = 'Critical', 'Critical'

class AlertStatus(models.TextChoices):
    NEW = 'New', 'New'
    READ = 'Read', 'Read'
    RESOLVED = 'Resolved', 'Resolved'

class Alert(models.Model):
    facility = models.ForeignKey('facilities.Facility', on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=50, choices=AlertType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=AlertSeverity.choices, default=AlertSeverity.MEDIUM)
    status = models.CharField(max_length=20, choices=AlertStatus.choices, default=AlertStatus.NEW)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.title} ({self.facility.name})"

class Recommendation(models.Model):
    facility = models.ForeignKey('facilities.Facility', on_delete=models.CASCADE, null=True, blank=True, related_name='recommendations')
    title = models.CharField(max_length=200)
    description = models.TextField()
    recommendation_type = models.CharField(max_length=100)
    priority = models.CharField(max_length=20, default='Medium')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.priority})"
