from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import RenewableGeneration
from .serializers import RenewableGenerationSerializer
from energy.models import EnergyReading

class RenewableListCreateView(generics.ListCreateAPIView):
    serializer_class = RenewableGenerationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = RenewableGeneration.objects.select_related('facility').all()
        fac_id = self.request.query_params.get('facility_id')
        if fac_id and fac_id != 'all':
            qs = qs.filter(facility_id=fac_id)
        source = self.request.query_params.get('source_type')
        if source and source != 'all':
            qs = qs.filter(source_type=source)
        return qs

class RenewableSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fac_id = request.query_params.get('facility_id')
        ren_qs = RenewableGeneration.objects.all()
        grid_qs = EnergyReading.objects.all()

        if fac_id and fac_id != 'all':
            ren_qs = ren_qs.filter(facility_id=fac_id)
            grid_qs = grid_qs.filter(meter__facility_id=fac_id)

        total_ren = ren_qs.aggregate(total=Sum('energy_generated'))['total'] or 0.0
        total_grid = grid_qs.aggregate(total=Sum('consumption'))['total'] or 0.0
        total_combined = total_ren + total_grid

        pct = round((total_ren / total_combined) * 100, 1) if total_combined > 0 else 0.0

        solar_sum = ren_qs.filter(source_type='Solar').aggregate(total=Sum('energy_generated'))['total'] or 0.0
        wind_sum = ren_qs.filter(source_type='Wind').aggregate(total=Sum('energy_generated'))['total'] or 0.0
        other_sum = ren_qs.filter(source_type='Other Renewable').aggregate(total=Sum('energy_generated'))['total'] or 0.0

        return Response({
            'total_generated': total_ren,
            'grid_consumed': total_grid,
            'renewable_percentage': pct,
            'by_source': {
                'Solar': solar_sum,
                'Wind': wind_sum,
                'Other Renewable': other_sum,
            }
        })
