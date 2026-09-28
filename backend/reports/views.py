import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Avg, Max
from energy.models import EnergyReading
from billing.models import Bill, Tariff
from renewable.models import RenewableGeneration
from facilities.models import Facility

class EnergyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fac_id = request.query_params.get('facility_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = EnergyReading.objects.all()
        if fac_id and fac_id != 'all':
            qs = qs.filter(meter__facility_id=fac_id)
        if start_date:
            qs = qs.filter(reading_date__gte=start_date)
        if end_date:
            qs = qs.filter(reading_date__lte=end_date)

        total_cons = qs.aggregate(Sum('consumption'))['consumption__sum'] or 0.0
        avg_cons = qs.aggregate(Avg('consumption'))['consumption__avg'] or 0.0
        peak_cons = qs.aggregate(Max('consumption'))['consumption__max'] or 0.0

        tariff = Tariff.objects.filter(active=True).first()
        rate = tariff.rate_per_kwh if tariff else 7.85
        total_cost = round(total_cons * rate, 2)

        return Response({
            'facility_id': fac_id or 'all',
            'start_date': start_date,
            'end_date': end_date,
            'total_consumption': round(total_cons, 2),
            'average_consumption': round(avg_cons, 2),
            'peak_consumption': round(peak_cons, 2),
            'total_cost': total_cost,
            'readings_count': qs.count(),
        })

class BillingReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fac_id = request.query_params.get('facility_id')
        bills = Bill.objects.all()
        if fac_id and fac_id != 'all':
            bills = bills.filter(facility_id=fac_id)
        
        total_amount = bills.aggregate(Sum('total_amount'))['total_amount__sum'] or 0.0
        total_units = bills.aggregate(Sum('units_consumed'))['units_consumed__sum'] or 0.0

        return Response({
            'bills_count': bills.count(),
            'total_units_billed': round(total_units, 2),
            'total_amount_billed': round(total_amount, 2),
        })

class ExportCsvView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        export_type = request.query_params.get('type', 'readings')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="greengrid-{export_type}.csv"'

        writer = csv.writer(response)
        if export_type == 'facilities':
            writer.writerow(['ID', 'Name', 'Location', 'Building Type', 'Area', 'Status'])
            for f in Facility.objects.all():
                writer.writerow([f.id, f.name, f.location, f.building_type, f.area, f.status])
        else:
            writer.writerow(['Meter', 'Facility', 'Date', 'Reading', 'Consumption', 'Peak', 'Off-Peak'])
            for r in EnergyReading.objects.select_related('meter', 'meter__facility').all():
                writer.writerow([r.meter.meter_number, r.meter.facility.name, r.reading_date, r.meter_reading, r.consumption, r.peak_consumption, r.off_peak_consumption])

        return response
