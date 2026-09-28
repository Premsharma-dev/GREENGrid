from django.urls import path
from .views import RenewableListCreateView, RenewableSummaryView

urlpatterns = [
    path('', RenewableListCreateView.as_view(), name='renewable_list_create'),
    path('summary/', RenewableSummaryView.as_view(), name='renewable_summary'),
]
