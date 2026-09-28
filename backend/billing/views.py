from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Tariff, Bill
from .serializers import TariffSerializer, BillSerializer
from facilities.models import Facility
from energy.models import EnergyReading

class TariffViewSet(viewsets.ModelViewSet):
    queryset = Tariff.objects.all()
    serializer_class = TariffSerializer
    permission_classes = [permissions.IsAuthenticated]

class BillListView(generics.ListAPIView):
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Bill.objects.select_related('facility').all()
        fac_id = self.request.query_params.get('facility_id')
        if fac_id and fac_id != 'all':
            qs = qs.filter(facility_id=fac_id)
        month = self.request.query_params.get('month')
        if month and month != 'all':
            qs = qs.filter(billing_month=month)
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            qs = qs.filter(payment_status=status_param)
        return qs

class BillDetailView(generics.RetrieveUpdateAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated]

class BillGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        fac_id = request.data.get('facility_id')
        billing_month = request.data.get('billing_month')

        if not fac_id or not billing_month:
            return Response({'error': 'facility_id and billing_month (YYYY-MM) are required.'}, status=status.HTTP_400_BAD_REQUEST)

        facility = Facility.objects.filter(id=fac_id).first()
        if not facility:
            return Response({'error': 'Facility not found'}, status=status.HTTP_404_NOT_FOUND)

        if Bill.objects.filter(facility=facility, billing_month=billing_month).exists():
            return Response({'error': f'Bill for {billing_month} already exists for {facility.name}'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate consumption in billing month
        total_units = EnergyReading.objects.filter(
            meter__facility=facility,
            reading_date__startswith=billing_month
        ).aggregate(total=Sum('consumption'))['total'] or 15000.0

        tariff = Tariff.objects.filter(active=True).first()
        rate = tariff.rate_per_kwh if tariff else 7.85
        fixed = tariff.fixed_charge if tariff else 3500.0
        tax_pct = tariff.tax_percentage if tariff else 12.0

        energy_charge = round(total_units * rate, 2)
        tax = round((energy_charge + fixed) * (tax_pct / 100.0), 2)
        total = round(energy_charge + fixed + tax, 2)

        bill = Bill.objects.create(
            facility=facility,
            billing_month=billing_month,
            units_consumed=total_units,
            rate_per_kwh=rate,
            energy_charge=energy_charge,
            fixed_charge=fixed,
            tax=tax,
            total_amount=total,
            payment_status='Pending'
        )

        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)
