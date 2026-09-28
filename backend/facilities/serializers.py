from rest_framework import serializers
from .models import Facility

class FacilitySerializer(serializers.ModelSerializer):
    meter_count = serializers.SerializerMethodField()
    current_consumption = serializers.SerializerMethodField()

    class Meta:
        model = Facility
        fields = [
            'id', 'name', 'location', 'building_type', 'area',
            'description', 'status', 'created_at', 'updated_at',
            'meter_count', 'current_consumption'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_meter_count(self, obj):
        return getattr(obj, 'meters', None) and obj.meters.count() or 0

    def get_current_consumption(self, obj):
        return 0
