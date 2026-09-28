from django.urls import path
from .views import AlertListView, AlertMarkReadView, AlertMarkResolvedView, RecommendationListView

urlpatterns = [
    path('', AlertListView.as_view(), name='alert_list'),
    path('<int:pk>/read/', AlertMarkReadView.as_view(), name='alert_mark_read'),
    path('<int:pk>/resolve/', AlertMarkResolvedView.as_view(), name='alert_mark_resolve'),
    path('recommendations/', RecommendationListView.as_view(), name='recommendations_list'),
]
