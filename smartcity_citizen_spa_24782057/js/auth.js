function setupLoginForm() {
    const form = document.getElementById("login-form");

    if (!form) {
        return;
    }

    form.onsubmit = async function(event) {
        event.preventDefault();

        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value;

        const result = await requestAPI("/api/token/", "POST", {
            username: username,
            password: password
        });

        console.log("Login response:", result);

        if (result.status === 200) {
            localStorage.setItem("access_token", result.data.access);
            localStorage.setItem("refresh_token", result.data.refresh);

            alert("Login berhasil.");
            window.location.hash = "#dashboard";
        } else {
            alert("Login gagal. Periksa username dan password.");
        }
    };
}

function setupRegisterForm() {
    const form = document.getElementById("register-form");

    if (!form) {
        return;
    }

    form.onsubmit = async function(event) {
        event.preventDefault();

        const username = document.getElementById("registerUsername").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const password2 = document.getElementById("registerPassword2").value;

        if (password !== password2) {
            alert("Password dan konfirmasi password tidak sama.");
            return;
        }

        const result = await requestAPI("/api/auth/register/", "POST", {
            username: username,
            email: email,
            password: password,
            password2: password2
        });

        console.log("Register response:", result);

        if (result.status === 200 || result.status === 201) {
            alert("Registrasi berhasil. Silakan login.");
            window.location.hash = "#login";
        } else {
            alert("Registrasi gagal: " + JSON.stringify(result.data));
        }
    };
}

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    alert("Logout berhasil.");
    window.location.hash = "#login";
}