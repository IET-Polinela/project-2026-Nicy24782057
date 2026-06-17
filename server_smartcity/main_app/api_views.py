from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Report
from .serializers import ReportSerializer
from .permissions import IsCitizen, IsOwnerAndDraftOrReadOnly


class ReportPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000


@extend_schema_view(
    destroy=extend_schema(exclude=True)
)
class ReportViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    serializer_class = ReportSerializer
    pagination_class = ReportPagination

    def get_queryset(self):
        user = self.request.user
        tab = self.request.query_params.get("tab", "my_reports")

        queryset = Report.objects.all().order_by("-updated_at")

        if not user.is_authenticated:
            return Report.objects.none()

        if tab == "my_reports":
            return queryset.filter(reporter=user)

        if tab == "feed":
            return queryset.exclude(reporter=user).exclude(status="DRAFT")

        return queryset.filter(reporter=user)

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCitizen()]

        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerAndDraftOrReadOnly()]

        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
