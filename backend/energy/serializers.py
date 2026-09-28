from rest_framework import serializers
from .models import EnergyReading

class EnergyReadingSerializer(serializers.ModelSerializer):
    meter_number = serializers.ReadOnlyField(source='meter.meter_number')
    facility_id = serializers.ReadOnlyField(source='meter.facility.id')
    facility_name = serializers.ReadOnlyField(source='meter.facility.name')

    class Meta:
        model = EnergyReading
        fields = [
            'id', 'meter', 'meter_number', 'facility_id', 'facility_name',
            'reading_date', 'meter_reading', 'consumption',
            'peak_consumption', 'off_peak_consumption', 'created_at'
        ]
        read_only_fields = ['id', 'consumption', 'peak_consumption', 'off_peak_consumption', 'created_at']
