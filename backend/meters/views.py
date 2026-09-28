from rest_framework import viewsets, permissions, filters
from .models import Meter
from .serializers import MeterSerializer

class MeterViewSet(viewsets.ModelViewSet):
    queryset = Meter.objects.select_related('facility').all()
    serializer_class = MeterSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['meter_number', 'facility__name']

    def get_queryset(self):
        qs = super().get_queryset()
        fac_id = self.request.query_params.get('facility_id')
        if fac_id and fac_id != 'all':
            qs = qs.filter(facility_id=fac_id)
        meter_type = self.request.query_params.get('meter_type')
        if meter_type and meter_type != 'all':
            qs = qs.filter(meter_type=meter_type)
        return qs
