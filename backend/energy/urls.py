from django.urls import path
from .views import EnergyReadingListCreateView, EnergyDailySummaryView, EnergyMonthlySummaryView, EnergyCsvImportView

urlpatterns = [
    path('readings/', EnergyReadingListCreateView.as_view(), name='energy_readings'),
    path('daily/', EnergyDailySummaryView.as_view(), name='energy_daily'),
    path('monthly/', EnergyMonthlySummaryView.as_view(), name='energy_monthly'),
    path('import-csv/', EnergyCsvImportView.as_view(), name='energy_import_csv'),
]
