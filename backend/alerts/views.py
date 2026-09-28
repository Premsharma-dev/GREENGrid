from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Alert, Recommendation
from .serializers import AlertSerializer, RecommendationSerializer

class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Alert.objects.select_related('facility').all()
        fac_id = self.request.query_params.get('facility_id')
        if fac_id and fac_id != 'all':
            qs = qs.filter(facility_id=fac_id)
        severity = self.request.query_params.get('severity')
        if severity and severity != 'all':
            qs = qs.filter(severity=severity)
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            qs = qs.filter(status=status_param)
        return qs

class AlertMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        alert = Alert.objects.filter(id=pk).first()
        if not alert:
            return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)
        alert.status = 'Read'
        alert.save()
        return Response(AlertSerializer(alert).data)

class AlertMarkResolvedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        alert = Alert.objects.filter(id=pk).first()
        if not alert:
            return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)
        alert.status = 'Resolved'
        alert.resolved_at = timezone.now()
        alert.save()
        return Response(AlertSerializer(alert).data)

class RecommendationListView(generics.ListAPIView):
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Recommendation.objects.select_related('facility').all()
        fac_id = self.request.query_params.get('facility_id')
        if fac_id and fac_id != 'all':
            qs = qs.filter(facility_id=fac_id)
        return qs
