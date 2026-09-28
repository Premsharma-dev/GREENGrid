from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/facilities/', include('facilities.urls')),
    path('api/meters/', include('meters.urls')),
    path('api/energy/', include('energy.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/renewable/', include('renewable.urls')),
    path('api/alerts/', include('alerts.urls')),
    path('api/reports/', include('reports.urls')),
]
