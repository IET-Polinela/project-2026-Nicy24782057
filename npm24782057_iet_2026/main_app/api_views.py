from django.db.models import Q
from rest_framework import viewsets, permissions
from .models import Report
from .serializers import ReportSerializer
from .permissions import IsCitizen, IsOwnerAndDraftOrReadOnly


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer

    def get_queryset(self):
        if getattr(self.request.user, 'is_admin', False):
            return Report.objects.exclude(status='DRAFT')

        return Report.objects.filter(
            ~Q(status='DRAFT') | Q(status='DRAFT', reporter=self.request.user)
        )

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCitizen()]

        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerAndDraftOrReadOnly()]

        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)