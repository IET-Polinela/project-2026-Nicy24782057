from django.contrib import messages
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import reverse_lazy
from django.views.generic import CreateView

from .forms import CitizenRegisterForm


class CustomLoginView(LoginView):
    template_name = 'usermanagement_24782057/login.html'
    redirect_authenticated_user = True

    def form_valid(self, form):
        messages.success(self.request, 'Berhasil login.')
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('report_list')


class CustomLogoutView(LogoutView):
    next_page = reverse_lazy('home')

    def post(self, request, *args, **kwargs):
        messages.success(request, 'Berhasil logout.')
        return super().post(request, *args, **kwargs)


class RegisterView(CreateView):
    form_class = CitizenRegisterForm
    template_name = 'usermanagement_24782057/register.html'
    success_url = reverse_lazy('login')

    def form_valid(self, form):
        messages.success(self.request, 'Registrasi berhasil. Silakan login.')
        return super().form_valid(form)
