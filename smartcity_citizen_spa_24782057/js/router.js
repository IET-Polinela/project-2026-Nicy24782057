function handleRouting() {
    renderNavbar();

    const hash = window.location.hash || "#login";
    const token = localStorage.getItem("access_token");

    if (!token && hash !== "#login") {
        window.location.hash = "#login";
        return;
    }

    if (hash === "#dashboard") {
        renderDashboardPage();
        return;
    }

    renderLoginPage();
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("DOMContentLoaded", handleRouting);