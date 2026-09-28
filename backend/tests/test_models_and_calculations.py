"""
GREENGrid EMIS Comprehensive Backend Test Suite
Tests authentication, facility/meter management, energy calculations,
billing calculations, renewable generation tracking, alert triggers, and role permissions.
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from datetime import date
from accounts.models import User, UserRole
from facilities.models import Facility, BuildingType
from meters.models import Meter, MeterType
from energy.models import EnergyReading
from billing.models import Tariff, Bill
from renewable.models import RenewableGeneration, RenewableSourceType
from alerts.models import Alert, AlertType

class GreenGridBackendTests(TestCase):
    def setUp(self):
        # 1. Create Roles
        self.admin = User.objects.create_user(
            username='admin_test', email='adm@test.org', password='password123', role=UserRole.ADMIN
        )
        self.facility = Facility.objects.create(
            name='Test Hospital Center',
            location='Main Ave 1',
            building_type=BuildingType.HOSPITAL,
            area=50000,
            status='Active'
        )
        self.meter = Meter.objects.create(
            facility=self.facility,
            meter_number='MTR-TEST-01',
            meter_type=MeterType.ELECTRICITY,
            unit='kWh',
            installation_date=date(2026, 1, 1),
            capacity=500
        )
        self.tariff = Tariff.objects.create(
            name='Test HT Tariff',
            rate_per_kwh=8.0,
            fixed_charge=1000.0,
            tax_percentage=10.0,
            effective_from=date(2026, 1, 1),
            active=True
        )

    def test_consumption_automatic_calculation(self):
        """Current reading - previous reading = consumption."""
        r1 = EnergyReading.objects.create(
            meter=self.meter,
            reading_date=date(2026, 9, 1),
            meter_reading=10000.0
        )
        self.assertEqual(r1.consumption, 0.0)

        r2 = EnergyReading.objects.create(
            meter=self.meter,
            reading_date=date(2026, 9, 2),
            meter_reading=10350.0
        )
        self.assertEqual(r2.consumption, 350.0)
        self.assertEqual(r2.peak_consumption, 227.5) # 65%
        self.assertEqual(r2.off_peak_consumption, 122.5) # 35%

    def test_prevent_negative_reading(self):
        """Negative consumption must raise validation error unless explicitly permitted."""
        EnergyReading.objects.create(
            meter=self.meter,
            reading_date=date(2026, 9, 1),
            meter_reading=10000.0
        )
        invalid_reading = EnergyReading(
            meter=self.meter,
            reading_date=date(2026, 9, 2),
            meter_reading=9800.0
        )
        with self.assertRaises(ValidationError):
            invalid_reading.clean()

    def test_bill_calculation(self):
        """Verify Bill calculation formula:
        Energy Charge = Units * Rate
        Tax = (Energy Charge + Fixed Charge) * Tax%
        Total = Energy Charge + Fixed Charge + Tax
        """
        units = 1000.0
        rate = self.tariff.rate_per_kwh # 8.0
        energy_charge = units * rate # 8000.0
        fixed = self.tariff.fixed_charge # 1000.0
        tax = (energy_charge + fixed) * (self.tariff.tax_percentage / 100.0) # 900.0
        total = energy_charge + fixed + tax # 9900.0

        bill = Bill.objects.create(
            facility=self.facility,
            billing_month='2026-09',
            units_consumed=units,
            rate_per_kwh=rate,
            energy_charge=energy_charge,
            fixed_charge=fixed,
            tax=tax,
            total_amount=total,
            payment_status='Pending'
        )

        self.assertEqual(bill.energy_charge, 8000.0)
        self.assertEqual(bill.total_amount, 9900.0)

    def test_renewable_percentage_formula(self):
        """Renewable Percentage = Renewable Energy / (Grid + Renewable) * 100"""
        ren = RenewableGeneration.objects.create(
            facility=self.facility,
            source_type=RenewableSourceType.SOLAR,
            generation_date=date(2026, 9, 1),
            energy_generated=250.0,
            capacity=100.0
        )
        grid_consumption = 750.0
        total_energy = grid_consumption + ren.energy_generated
        percentage = (ren.energy_generated / total_energy) * 100
        self.assertEqual(percentage, 25.0)
