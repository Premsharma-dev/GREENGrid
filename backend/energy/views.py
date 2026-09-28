import csv
import io
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Avg, Max, Min
from .models import EnergyReading
from .serializers import EnergyReadingSerializer
from meters.models import Meter

class EnergyReadingListCreateView(generics.ListCreateAPIView):
    serializer_class = EnergyReadingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = EnergyReading.objects.select_related('meter', 'meter__facility').all()
        fac_id = self.request.query_params.get('facility_id')
        if fac_id and fac_id != 'all':
            qs = qs.filter(meter__facility_id=fac_id)
        meter_id = self.request.query_params.get('meter_id')
        if meter_id and meter_id != 'all':
            qs = qs.filter(meter_id=meter_id)
        start_date = self.request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(reading_date__gte=start_date)
        end_date = self.request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(reading_date__lte=end_date)
        return qs

class EnergyDailySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fac_id = request.query_params.get('facility_id')
        days = int(request.query_params.get('days', 30))
        qs = EnergyReading.objects.all()
        if fac_id and fac_id != 'all':
            qs = qs.filter(meter__facility_id=fac_id)

        daily_data = (
            qs.values('reading_date')
            .annotate(
                consumption=Sum('consumption'),
                peak=Sum('peak_consumption'),
                off_peak=Sum('off_peak_consumption')
            )
            .order_by('reading_date')
        )
        return Response(list(daily_data))

class EnergyMonthlySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fac_id = request.query_params.get('facility_id')
        # Aggregate monthly
        return Response([])

class EnergyCsvImportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        success_count = 0
        failed_count = 0
        errors = []

        for row in reader:
            try:
                meter_key = row.get('meter_id') or row.get('meter_number')
                date_val = row.get('date')
                reading_val = float(row.get('reading', 0))

                meter = Meter.objects.filter(meter_number=meter_key).first()
                if not meter:
                    failed_count += 1
                    errors.append(f"Meter {meter_key} not found")
                    continue

                EnergyReading.objects.create(
                    meter=meter,
                    reading_date=date_val,
                    meter_reading=reading_val
                )
                success_count += 1
            except Exception as e:
                failed_count += 1
                errors.append(str(e))

        return Response({
            'successCount': success_count,
            'failedCount': failed_count,
            'errors': errors
        })
