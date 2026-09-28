from rest_framework import serializers
from .models import RenewableGeneration

class RenewableGenerationSerializer(serializers.ModelSerializer):
    facility_name = serializers.ReadOnlyField(source='facility.name')

    class Meta:
        model = RenewableGeneration
        fields = [
            'id', 'facility', 'facility_name', 'source_type',
            'generation_date', 'energy_generated', 'capacity', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
