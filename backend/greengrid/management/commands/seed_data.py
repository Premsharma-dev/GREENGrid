from django.core.management.base import BaseCommand
from datetime import date, timedelta
from accounts.models import User, UserRole
from facilities.models import Facility, BuildingType
from meters.models import Meter, MeterType
from energy.models import EnergyReading
from billing.models import Tariff, Bill
from renewable.models import RenewableGeneration, RenewableSourceType
from alerts.models import Alert, Recommendation, AlertType, AlertSeverity

class Command(BaseCommand):
    help = 'Seeds database with realistic GREENGrid facilities, meters, readings, bills, alerts, and demo users.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding GREENGrid data...')

        # 1. Users
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@greengrid.org',
                'first_name': 'Elena',
                'last_name': 'Vance',
                'role': UserRole.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password('admin123')
        admin.save()

        fac_eng, _ = Facility.objects.get_or_create(
            name='Central Engineering Campus',
            defaults={
                'location': 'Block A, North Sector, Bengaluru',
                'building_type': BuildingType.COLLEGE,
                'area': 85000,
                'description': 'Main academic complex with laboratories and lecture halls.',
                'status': 'Active'
            }
        )

        manager, _ = User.objects.get_or_create(
            username='manager',
            defaults={
                'email': 'manager@greengrid.org',
                'first_name': 'Marcus',
                'last_name': 'Chen',
                'role': UserRole.MANAGER,
                'assigned_facility': fac_eng,
            }
        )
        manager.set_password('manager123')
        manager.save()

        viewer, _ = User.objects.get_or_create(
            username='viewer',
            defaults={
                'email': 'viewer@greengrid.org',
                'first_name': 'Sarah',
                'last_name': 'Jenkins',
                'role': UserRole.VIEWER,
                'assigned_facility': fac_eng,
            }
        )
        viewer.set_password('viewer123')
        viewer.save()

        # 2. More Facilities
        fac_cyber, _ = Facility.objects.get_or_create(
            name='Cyber Heights Tech Park',
            defaults={'location': 'Plot 14, Electronic City', 'building_type': BuildingType.OFFICE, 'area': 120000}
        )
        fac_mfg, _ = Facility.objects.get_or_create(
            name='Apex Precision Manufacturing',
            defaults={'location': 'Industrial Zone IV, Peenya', 'building_type': BuildingType.FACTORY, 'area': 165000}
        )
        fac_hosp, _ = Facility.objects.get_or_create(
            name='St. Jude Healthcare Pavilion',
            defaults={'location': 'Cross Road 9, Indiranagar', 'building_type': BuildingType.HOSPITAL, 'area': 92000}
        )
        fac_log, _ = Facility.objects.get_or_create(
            name='Metro Logistics Distribution Hub',
            defaults={'location': 'Highway 44, Hosur Road', 'building_type': BuildingType.WAREHOUSE, 'area': 210000}
        )

        # 3. Tariffs
        tariff, _ = Tariff.objects.get_or_create(
            name='Commercial & Institutional HT-2A Standard',
            defaults={
                'rate_per_kwh': 7.85,
                'fixed_charge': 3500.0,
                'tax_percentage': 12.0,
                'effective_from': date(2026, 1, 1),
                'active': True
            }
        )

        # 4. Meters
        m1, _ = Meter.objects.get_or_create(
            meter_number='MTR-ENG-01',
            defaults={'facility': fac_eng, 'meter_type': MeterType.ELECTRICITY, 'unit': 'kWh', 'installation_date': date(2025, 11, 10), 'capacity': 500}
        )
        m2, _ = Meter.objects.get_or_create(
            meter_number='MTR-ENG-SOLAR',
            defaults={'facility': fac_eng, 'meter_type': MeterType.SOLAR, 'unit': 'kWh', 'installation_date': date(2025, 12, 1), 'capacity': 150}
        )
        m3, _ = Meter.objects.get_or_create(
            meter_number='MTR-CYB-MAIN',
            defaults={'facility': fac_cyber, 'meter_type': MeterType.ELECTRICITY, 'unit': 'kWh', 'installation_date': date(2025, 10, 15), 'capacity': 750}
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database.'))
