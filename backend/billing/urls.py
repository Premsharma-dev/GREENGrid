from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TariffViewSet, BillListView, BillDetailView, BillGenerateView

router = DefaultRouter()
router.register(r'tariffs', TariffViewSet, basename='tariff')

urlpatterns = [
    path('generate/', BillGenerateView.as_view(), name='bill_generate'),
    path('<int:pk>/', BillDetailView.as_view(), name='bill_detail'),
    path('', BillListView.as_view(), name='bill_list'),
    path('', include(router.urls)),
]
