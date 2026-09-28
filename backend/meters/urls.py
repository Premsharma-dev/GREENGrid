from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeterViewSet

router = DefaultRouter()
router.register(r'', MeterViewSet, basename='meter')

urlpatterns = [
    path('', include(router.urls)),
]
