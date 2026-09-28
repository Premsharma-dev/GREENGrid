from rest_framework import serializers
from .models import Alert, Recommendation

class AlertSerializer(serializers.ModelSerializer):
    facility_name = serializers.ReadOnlyField(source='facility.name')

    class Meta:
        model = Alert
        fields = [
            'id', 'facility', 'facility_name', 'alert_type',
            'title', 'message', 'severity', 'status',
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at']

class RecommendationSerializer(serializers.ModelSerializer):
    facility_name = serializers.ReadOnlyField(source='facility.name')

    class Meta:
        model = Recommendation
        fields = [
            'id', 'facility', 'facility_name', 'title',
            'description', 'recommendation_type', 'priority', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
