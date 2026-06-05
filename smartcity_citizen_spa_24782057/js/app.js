let currentTab = "my_reports";
let currentPage = 1;
let editingReportId = null;
let reportModal = null;

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
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body">
                        <h5 class="fw-bold">
                            <i class="bi bi-person-badge me-2"></i>Menu Citizen
                        </h5>
                        <p class="text-muted mb-3">Portal laporan warga berbasis SPA.</p>

                        <button class="btn btn-primary w-100 mb-2" onclick="openCreateModal()">
                            <i class="bi bi-plus-circle me-1"></i>Tambah Laporan Baru
                        </button>

                        <button class="btn btn-outline-primary w-100" onclick="loadDashboardData(currentTab, currentPage)">
                            <i class="bi bi-arrow-clockwise me-1"></i>Muat Ulang
                        </button>
                    </div>
                </div>

                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <h5 class="fw-bold mb-3">
                            <i class="bi bi-bar-chart-line me-2"></i>Rekap Status
                        </h5>

                        <div class="d-flex justify-content-between border-bottom py-2">
                            <span>Draft</span>
                            <strong id="statDraft">0</strong>
                        </div>

                        <div class="d-flex justify-content-between border-bottom py-2">
                            <span>Diproses</span>
                            <strong id="statProcess">0</strong>
                        </div>

                        <div class="d-flex justify-content-between py-2">
                            <span>Selesai</span>
                            <strong id="statDone">0</strong>
                        </div>
                    </div>
                </div>
            </aside>

            <section class="col-12 col-lg-6">
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body">
                        <h4 class="fw-bold mb-2">
                            <i class="bi bi-speedometer2 me-2"></i>Dashboard Citizen
                        </h4>
                        <p class="text-muted mb-0">Data laporan ditarik dari Django REST API.</p>
                    </div>
                </div>

                <ul class="nav nav-pills mb-3">
                    <li class="nav-item">
                        <button id="tabMyReports" class="nav-link active" onclick="switchTab('my_reports')">
                            <i class="bi bi-journal-text me-1"></i>Laporan Saya
                        </button>
                    </li>
                    <li class="nav-item">
                        <button id="tabFeed" class="nav-link" onclick="switchTab('feed')">
                            <i class="bi bi-globe2 me-1"></i>Feed Kota
                        </button>
                    </li>
                </ul>

                <div id="report-list"></div>
                <div id="pagination-container" class="mt-3"></div>
            </section>

            <aside class="col-12 col-lg-3">
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <h5 class="fw-bold">
                            <i class="bi bi-shield-lock me-2"></i>Autentikasi
                        </h5>
                        <p class="text-muted mb-0">Request API menggunakan JWT Bearer Token dari localStorage.</p>
                    </div>
                </div>
            </aside>
        </div>
    `;

    reportModal = new bootstrap.Modal(document.getElementById("reportModal"));
    await loadDashboardData("my_reports", 1);
}

function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;

    document.getElementById("tabMyReports").classList.toggle("active", tab === "my_reports");
    document.getElementById("tabFeed").classList.toggle("active", tab === "feed");

    loadDashboardData(tab, 1);
}

async function loadDashboardData(tab = currentTab, page = currentPage) {
    currentTab = tab;
    currentPage = page;

    const result = await requestAPI(`/api/report/?tab=${tab}&page=${page}`, "GET");

    console.log("Dashboard data:", result);

    if (result.status === 401) {
        alert("Sesi login habis. Silakan login ulang.");
        logout();
        return;
    }

    if (!result.ok) {
        document.getElementById("report-list").innerHTML = `
            <div class="alert alert-danger">
                Gagal memuat laporan dari API.
            </div>
        `;
        return;
    }

    const reports = result.data.results || [];

    renderList(reports);
    renderPagination(result.data);
    await loadSummaryStats();
}

async function loadSummaryStats() {
    const result = await requestAPI("/api/report/?tab=my_reports&page_size=1000", "GET");

    if (!result.ok) {
        return;
    }

    const reports = result.data.results || [];

    const draftTotal = reports.filter(report => report.status === "DRAFT").length;
    const processTotal = reports.filter(report =>
        report.status === "REPORTED" ||
        report.status === "VERIFIED" ||
        report.status === "IN_PROGRESS"
    ).length;
    const doneTotal = reports.filter(report => report.status === "RESOLVED").length;

    document.getElementById("statDraft").textContent = draftTotal;
    document.getElementById("statProcess").textContent = processTotal;
    document.getElementById("statDone").textContent = doneTotal;
}

function renderList(reports) {
    const container = document.getElementById("report-list");

    if (!reports.length) {
        container.innerHTML = `
            <div class="alert alert-warning">
                Belum ada laporan pada tab ini.
            </div>
        `;
        return;
    }

    container.innerHTML = reports.map(report => renderReportCard(report)).join("");
}

function renderReportCard(report) {
    const progress = getStatusProgress(report.status);
    const actionButtons = renderActionButtons(report);

    return `
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <h5 class="fw-bold mb-1">${escapeHTML(report.title)}</h5>
                        <p class="text-muted mb-1">
                            <i class="bi bi-tag me-1"></i>${escapeHTML(report.category)}
                            <span class="mx-1">-</span>
                            <i class="bi bi-geo-alt me-1"></i>${escapeHTML(report.location)}
                        </p>
                        <p class="mb-2">${escapeHTML(report.description)}</p>
                        <small class="text-muted">${escapeHTML(report.reporter)}</small>
                    </div>
                    <span class="badge ${progress.badgeClass}">${progress.label}</span>
                </div>

                <div class="mt-3">
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${progress.barClass}" style="width: ${progress.percent}%;"></div>
                    </div>
                    <small class="text-muted">${progress.percent}% - ${progress.label}</small>
                </div>

                ${actionButtons}
            </div>
        </div>
    `;
}

function renderActionButtons(report) {
    if (currentTab !== "my_reports") {
        return "";
    }

    if (!report.is_owner || report.status !== "DRAFT") {
        return "";
    }

    return `
        <div class="d-flex gap-2 mt-3">
            <button class="btn btn-sm btn-warning text-dark" onclick="editDraft(${report.id})">
                <i class="bi bi-pencil-square me-1"></i>Edit
            </button>
            <button class="btn btn-sm btn-primary" onclick="submitExistingDraft(${report.id})">
                <i class="bi bi-send me-1"></i>Ajukan
            </button>
        </div>
    `;
}

function getStatusProgress(status) {
    if (status === "DRAFT") {
        return {
            label: "Draft",
            percent: 20,
            badgeClass: "bg-dark",
            barClass: "bg-dark"
        };
    }

    if (status === "REPORTED") {
        return {
            label: "Reported",
            percent: 40,
            badgeClass: "bg-secondary",
            barClass: "bg-secondary"
        };
    }

    if (status === "VERIFIED") {
        return {
            label: "Verified",
            percent: 60,
            badgeClass: "bg-primary",
            barClass: "bg-primary"
        };
    }

    if (status === "IN_PROGRESS") {
        return {
            label: "In Progress",
            percent: 80,
            badgeClass: "bg-warning text-dark",
            barClass: "bg-warning"
        };
    }

    if (status === "RESOLVED") {
        return {
            label: "Resolved",
            percent: 100,
            badgeClass: "bg-success",
            barClass: "bg-success"
        };
    }

    return {
        label: status,
        percent: 0,
        badgeClass: "bg-secondary",
        barClass: "bg-secondary"
    };
}

function renderPagination(data) {
    const container = document.getElementById("pagination-container");

    if (!data.count || data.count <= 10) {
        container.innerHTML = "";
        return;
    }

    const totalPages = Math.ceil(data.count / 10);
    let buttons = "";

    for (let page = 1; page <= totalPages; page++) {
        buttons += `
            <button class="btn btn-sm ${page === currentPage ? "btn-primary" : "btn-outline-primary"} me-1"
                    onclick="loadDashboardData('${currentTab}', ${page})">
                ${page}
            </button>
        `;
    }

    container.innerHTML = `
        <div class="d-flex justify-content-center">
            ${buttons}
        </div>
    `;
}

function openCreateModal() {
    editingReportId = null;
    document.getElementById("reportModalLabel").innerHTML = `<i class="bi bi-pencil-square me-2"></i>Tambah Laporan Baru`;
    document.getElementById("reportForm").reset();
    reportModal.show();
}

async function editDraft(id) {
    const result = await requestAPI(`/api/report/${id}/`, "GET");

    if (!result.ok) {
        alert("Gagal mengambil data laporan.");
        return;
    }

    editingReportId = id;

    document.getElementById("reportModalLabel").innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Draft`;
    document.getElementById("reportTitle").value = result.data.title;
    document.getElementById("reportCategory").value = result.data.category;
    document.getElementById("reportLocation").value = result.data.location;
    document.getElementById("reportDescription").value = result.data.description;

    reportModal.show();
}

async function submitReport(status) {
    const title = document.getElementById("reportTitle").value.trim();
    const category = document.getElementById("reportCategory").value.trim();
    const location = document.getElementById("reportLocation").value.trim();
    const description = document.getElementById("reportDescription").value.trim();

    if (!title || !category || !location || !description) {
        alert("Semua field wajib diisi.");
        return;
    }

    const payload = {
        title: title,
        category: category,
        location: location,
        description: description,
        status: status
    };

    const method = editingReportId === null ? "POST" : "PUT";
    const endpoint = editingReportId === null ? "/api/report/" : `/api/report/${editingReportId}/`;

    const result = await requestAPI(endpoint, method, payload);

    if (result.status === 201 || result.status === 200) {
        reportModal.hide();
        document.getElementById("reportForm").reset();
        editingReportId = null;
        await loadDashboardData(currentTab, currentPage);
        return;
    }

    alert("Gagal menyimpan laporan.");
}

async function submitExistingDraft(id) {
    const oldData = await requestAPI(`/api/report/${id}/`, "GET");

    if (!oldData.ok) {
        alert("Gagal mengambil data draft.");
        return;
    }

    const payload = {
        title: oldData.data.title,
        category: oldData.data.category,
        location: oldData.data.location,
        description: oldData.data.description,
        status: "REPORTED"
    };

    const result = await requestAPI(`/api/report/${id}/`, "PUT", payload);

    if (result.status === 200) {
        await loadDashboardData(currentTab, currentPage);
        return;
    }

    alert("Gagal mengajukan laporan.");
}

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}