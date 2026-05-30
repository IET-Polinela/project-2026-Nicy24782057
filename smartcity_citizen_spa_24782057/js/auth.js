function setupLoginForm() {
    const form = document.getElementById("login-form");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        const result = await requestAPI("/api/token/", "POST", {
            username: username,
            password: password
        });

        console.log("Login response:", result);

        if (result.status === 200) {
            localStorage.setItem("access_token", result.data.access);
            localStorage.setItem("refresh_token", result.data.refresh);
            alert("Login berhasil");
            window.location.hash = "#dashboard";
        } else {
            alert("Login gagal. Periksa username dan password.");
        }
    });
}

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.hash = "#login";
}