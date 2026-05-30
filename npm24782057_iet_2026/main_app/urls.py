from django.urls import path
from .views import (
    HomeView,
    ReportListView,
    ReportDetailView,
    ReportCreateView,
    ReportUpdateView,
    ReportDeleteView,
    ReportUpdateStatusView,
    ReportSubmitView,
    live_search_reports,
    report_detail_modal_api,
)

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('reports/', ReportListView.as_view(), name='report_list'),
    path('report/<int:pk>/', ReportDetailView.as_view(), name='report_detail'),
    path('add/', ReportCreateView.as_view(), name='add_report'),
    path('edit/<int:pk>/', ReportUpdateView.as_view(), name='edit_report'),
    path('delete/<int:pk>/', ReportDeleteView.as_view(), name='delete_report'),
    path('update-status/<int:pk>/', ReportUpdateStatusView.as_view(), name='update_status'),
    path('submit/<int:pk>/', ReportSubmitView.as_view(), name='submit_report'),
    path('api/live-search/', live_search_reports, name='live_search_reports'),
    path('api/report-modal/<int:pk>/', report_detail_modal_api, name='report_detail_modal_api'),
]