function renderNavbar() {
    const navMenu = document.getElementById("nav-menu");
    const token = localStorage.getItem("access_token");

    if (token) {
        navMenu.innerHTML = `
            <a href="#dashboard" class="btn btn-outline-light btn-sm me-2">
                <i class="bi bi-speedometer2 me-1"></i>Dashboard
            </a>
            <button onclick="logout()" class="btn btn-light btn-sm">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
            </button>
        `;
    } else {
        navMenu.innerHTML = `
            <a href="#login" class="btn btn-light btn-sm">
                <i class="bi bi-box-arrow-in-right me-1"></i>Login
            </a>
        `;
    }
}

function renderLoginPage() {
    const app = document.getElementById("app-content");

    app.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card shadow-sm border-0">
                    <div class="card-body p-4">
                        <h4 class="fw-bold mb-3">
                            <i class="bi bi-person-circle me-2"></i>Login Citizen
                        </h4>

                        <form id="login-form">
                            <div class="mb-3">
                                <label class="form-label">Username</label>
                                <input type="text" id="loginUsername" class="form-control" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" id="loginPassword" class="form-control" required>
                            </div>

                            <button type="submit" class="btn btn-primary w-100">
                                <i class="bi bi-box-arrow-in-right me-1"></i>Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupLoginForm();
}

async function renderDashboardPage() {
    const app = document.getElementById("app-content");

    app.innerHTML = `
        <div class="row g-4">
            <aside class="col-12 col-lg-3">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body">
                        <h5 class="fw-bold">
                            <i class="bi bi-person-badge me-2"></i>Menu Citizen
                        </h5>
                        <p class="text-muted mb-3">Portal laporan warga berbasis SPA.</p>
                        <button class="btn btn-outline-primary w-100" onclick="loadReports()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Muat Ulang
                        </button>
                    </div>
                </div>
            </aside>

            <section class="col-12 col-lg-6">
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body">
                        <h4 class="fw-bold mb-2">
                            <i class="bi bi-speedometer2 me-2"></i>Dashboard Citizen
                        </h4>
                        <p class="text-muted mb-0">Daftar laporan dari backend Django REST API.</p>
                    </div>
                </div>

                <div id="report-list"></div>
            </section>

            <aside class="col-12 col-lg-3">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body">
                        <h5 class="fw-bold">
                            <i class="bi bi-shield-lock me-2"></i>Autentikasi
                        </h5>
                        <p class="text-muted mb-0">Token JWT disimpan di localStorage setelah login berhasil.</p>
                    </div>
                </div>
            </aside>
        </div>
    `;

    await loadReports();
}

async function loadReports() {
    const container = document.getElementById("report-list");
    const result = await requestAPI("/api/report/", "GET");

    console.log("GET reports response:", result);

    if (result.status === 401) {
        alert("Sesi login habis. Silakan login ulang.");
        logout();
        return;
    }

    if (!result.ok) {
        container.innerHTML = `
            <div class="alert alert-danger">
                Gagal memuat laporan dari API.
            </div>
        `;
        return;
    }

    if (!result.data || result.data.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                Belum ada laporan yang dapat ditampilkan.
            </div>
        `;
        return;
    }

    container.innerHTML = result.data.map(report => `
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <h5 class="fw-bold mb-1">${report.title}</h5>
                        <p class="text-muted mb-1">
                            <i class="bi bi-tag me-1"></i>${report.category}
                            <span class="mx-1">-</span>
                            <i class="bi bi-geo-alt me-1"></i>${report.location}
                        </p>
                        <p class="mb-2">${report.description}</p>
                        <small class="text-muted">${report.reporter}</small>
                    </div>
                    <span class="badge bg-secondary">${report.status}</span>
                </div>
            </div>
        </div>
    `).join("");
}