from rest_framework import serializers
from .models import Tariff, Bill

class TariffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tariff
        fields = '__all__'

class BillSerializer(serializers.ModelSerializer):
    facility_name = serializers.ReadOnlyField(source='facility.name')

    class Meta:
        model = Bill
        fields = [
            'id', 'facility', 'facility_name', 'billing_month',
            'units_consumed', 'rate_per_kwh', 'energy_charge',
            'fixed_charge', 'tax', 'total_amount', 'payment_status',
            'generated_at', 'due_date'
        ]
        read_only_fields = [
            'id', 'rate_per_kwh', 'energy_charge', 'fixed_charge',
            'tax', 'total_amount', 'generated_at'
        ]
