from django.urls import path
from .views import EnergyReportView, BillingReportView, ExportCsvView

urlpatterns = [
    path('energy/', EnergyReportView.as_view(), name='report_energy'),
    path('billing/', BillingReportView.as_view(), name='report_billing'),
    path('export-csv/', ExportCsvView.as_view(), name='report_export_csv'),
]
