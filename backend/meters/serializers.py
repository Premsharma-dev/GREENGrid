from rest_framework import serializers
from .models import Meter

class MeterSerializer(serializers.ModelSerializer):
    facility_name = serializers.ReadOnlyField(source='facility.name')

    class Meta:
        model = Meter
        fields = [
            'id', 'facility', 'facility_name', 'meter_number',
            'meter_type', 'unit', 'installation_date', 'capacity',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
