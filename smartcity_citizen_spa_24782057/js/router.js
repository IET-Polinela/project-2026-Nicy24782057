function renderRegisterPage() {
    const appContent = document.getElementById("app-content");

    appContent.innerHTML = `
        <div class="row justify-content-center mt-5">
            <div class="col-12 col-md-6 col-lg-5">
                <div class="card shadow-sm border-0">
                    <div class="card-body p-4">
                        <h3 class="mb-4 text-center">
                            <i class="bi bi-person-plus me-2"></i>Register Citizen
                        </h3>

                        <form id="register-form">
                            <div class="mb-3">
                                <label class="form-label">Username</label>
                                <input type="text" id="registerUsername" class="form-control" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" id="registerEmail" class="form-control" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" id="registerPassword" class="form-control" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Konfirmasi Password</label>
                                <input type="password" id="registerPassword2" class="form-control" required>
                            </div>

                            <button type="submit" class="btn btn-primary w-100">
                                <i class="bi bi-person-plus me-1"></i>Daftar
                            </button>

                            <div class="text-center mt-3">
                                <a href="#login" class="text-decoration-none">
                                    Sudah punya akun? Login
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupRegisterForm();
}

function handleRouting() {
    const hash = window.location.hash || "#login";
    const token = localStorage.getItem("access_token");

    renderNavbar();

    if (hash === "#register") {
        renderRegisterPage();
        renderNavbar();
        return;
    }

    if (hash === "#dashboard") {
        if (!token) {
            window.location.hash = "#login";
            return;
        }

        renderDashboardPage();
        renderNavbar();
        return;
    }

    renderLoginPage();
    setupLoginForm();
    renderNavbar();
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("DOMContentLoaded", handleRouting);