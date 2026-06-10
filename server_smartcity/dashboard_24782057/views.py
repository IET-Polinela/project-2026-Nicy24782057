from django.http import JsonResponse
from django.views.generic import TemplateView
from django.db.models import Count

from main_app.models import Report


class DashboardView(TemplateView):
    template_name = 'dashboard_24782057/dashboard.html'


def dashboard_stats_api(request):
    status_counts = Report.objects.values('status').annotate(total=Count('id')).order_by('status')
    category_counts = Report.objects.values('category').annotate(total=Count('id')).order_by('category')

    latest_reported = Report.objects.filter(status='REPORTED').order_by('-id')[:5]
    latest_resolved = Report.objects.filter(status='RESOLVED').order_by('-id')[:5]

    data = {
        'status_distribution': list(status_counts),
        'category_distribution': list(category_counts),
        'latest_reported': [
            {
                'id': report.id,
                'title': report.title,
                'category': report.category,
                'location': report.location,
                'status': report.status,
            }
            for report in latest_reported
        ],
        'latest_resolved': [
            {
                'id': report.id,
                'title': report.title,
                'category': report.category,
                'location': report.location,
                'status': report.status,
            }
            for report in latest_resolved
        ],
    }

    return JsonResponse(data)
