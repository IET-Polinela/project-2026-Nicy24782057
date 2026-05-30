from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import TemplateView, ListView, DetailView, CreateView, UpdateView, DeleteView
from django.http import JsonResponse
from django.db.models import Q

from .models import Report
from .forms import ReportForm


class AdminRequiredMixin:
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_admin:
            messages.error(request, 'Akses Ditolak.')
            return redirect('report_list')
        return super().dispatch(request, *args, **kwargs)


class CitizenRequiredMixin:
    def dispatch(self, request, *args, **kwargs):
        if (
            not request.user.is_authenticated
            or request.user.is_admin
            or not getattr(request.user, 'is_member', True)
        ):
            messages.error(request, 'Akses Ditolak.')
            return redirect('report_list')
        return super().dispatch(request, *args, **kwargs)


class OwnerDraftRequiredMixin:
    def dispatch(self, request, *args, **kwargs):
        report = self.get_object()

        if not request.user.is_authenticated:
            messages.error(request, 'Akses Ditolak.')
            return redirect('report_list')

        if report.reporter != request.user or report.status != 'DRAFT':
            messages.error(request, 'Laporan hanya bisa diubah atau dihapus oleh pemilik saat status masih Draft.')
            return redirect('report_list')

        return super().dispatch(request, *args, **kwargs)


class HomeView(TemplateView):
    template_name = 'main_app/home.html'


class ReportListView(ListView):
    model = Report
    template_name = 'main_app/report_list.html'
    context_object_name = 'reports'

    def get_queryset(self):
        return get_visible_reports_for_user(self.request.user)


class ReportDetailView(DetailView):
    model = Report
    template_name = 'main_app/report_detail.html'
    context_object_name = 'report'

    def get_queryset(self):
        return get_visible_reports_for_user(self.request.user)


class ReportCreateView(CitizenRequiredMixin, CreateView):
    model = Report
    form_class = ReportForm
    template_name = 'main_app/add_report.html'
    success_url = reverse_lazy('report_list')

    def form_valid(self, form):
        form.instance.reporter = self.request.user
        form.instance.status = 'DRAFT'
        messages.success(self.request, 'Laporan berhasil dibuat sebagai Draft.')
        return super().form_valid(form)


class ReportUpdateView(OwnerDraftRequiredMixin, UpdateView):
    model = Report
    form_class = ReportForm
    template_name = 'main_app/edit_report.html'
    success_url = reverse_lazy('report_list')

    def form_valid(self, form):
        form.instance.status = 'DRAFT'
        messages.success(self.request, 'Laporan berhasil diperbarui.')
        return super().form_valid(form)


class ReportDeleteView(OwnerDraftRequiredMixin, DeleteView):
    model = Report
    template_name = 'main_app/delete_report.html'
    context_object_name = 'report'
    success_url = reverse_lazy('report_list')

    def form_valid(self, form):
        messages.success(self.request, 'Laporan berhasil dihapus.')
        return super().form_valid(form)


class ReportUpdateStatusView(AdminRequiredMixin, View):
    def post(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        new_status = request.POST.get('status')

        valid_transitions = {
            'REPORTED': 'VERIFIED',
            'VERIFIED': 'IN_PROGRESS',
            'IN_PROGRESS': 'RESOLVED',
        }

        if report.status in valid_transitions and valid_transitions[report.status] == new_status:
            report.status = new_status
            report.save()
            messages.success(
                request,
                f'Status laporan berhasil diubah menjadi {report.get_status_display()}.'
            )
        else:
            messages.error(request, 'Perubahan status tidak valid.')

        return redirect('report_list')


class ReportSubmitView(View):
    def post(self, request, pk):
        report = get_object_or_404(Report, pk=pk)

        if not request.user.is_authenticated:
            messages.error(request, 'Akses Ditolak.')
            return redirect('report_list')

        if report.reporter != request.user or report.status != 'DRAFT':
            messages.error(request, 'Laporan hanya bisa dikirim oleh pemilik saat status masih Draft.')
            return redirect('report_list')

        report.status = 'REPORTED'
        report.save()
        messages.success(request, 'Laporan berhasil dikirim ke admin.')
        return redirect('report_list')


def get_visible_reports_for_user(user):
    if user.is_authenticated and user.is_admin:
        return Report.objects.exclude(status='DRAFT').order_by('-created_at')

    if user.is_authenticated:
        return Report.objects.filter(
            ~Q(status='DRAFT') | Q(status='DRAFT', reporter=user)
        ).order_by('-created_at')

    return Report.objects.exclude(status='DRAFT').order_by('-created_at')


def live_search_reports(request):
    keyword = request.GET.get('q', '').strip()
    reports = get_visible_reports_for_user(request.user)

    if keyword:
        reports = reports.filter(
            Q(title__icontains=keyword) |
            Q(category__icontains=keyword) |
            Q(location__icontains=keyword) |
            Q(status__icontains=keyword)
        )

    data = []
    for report in reports:
        data.append({
            'id': report.id,
            'title': report.title,
            'category': report.category,
            'location': report.location,
            'status': report.status,
            'can_edit': request.user.is_authenticated and report.reporter == request.user and report.status == 'DRAFT',
            'can_delete': request.user.is_authenticated and report.reporter == request.user and report.status == 'DRAFT',
            'can_submit': request.user.is_authenticated and report.reporter == request.user and report.status == 'DRAFT',
            'can_update_status': request.user.is_authenticated and request.user.is_admin,
        })

    return JsonResponse({'reports': data})


def report_detail_modal_api(request, pk):
    try:
        report = get_visible_reports_for_user(request.user).get(pk=pk)
        data = {
            'id': report.id,
            'title': report.title,
            'category': report.category,
            'description': report.description,
            'location': report.location,
            'status': report.status,
            'created_at': report.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        }
        return JsonResponse(data)
    except Report.DoesNotExist:
        return JsonResponse({'error': 'Report tidak ditemukan'}, status=404)