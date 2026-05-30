from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Report
from .serializers import ReportSerializer
from .permissions import IsCitizen, IsOwnerAndDraftOrReadOnly


class ReportViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    serializer_class = ReportSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Report.objects.none()

        if getattr(user, 'is_admin', False):
            return Report.objects.exclude(status='DRAFT').order_by('-created_at')

        return Report.objects.filter(
            ~Q(status='DRAFT') | Q(status='DRAFT', reporter=user)
        ).order_by('-created_at')

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCitizen()]

        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerAndDraftOrReadOnly()]

        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)