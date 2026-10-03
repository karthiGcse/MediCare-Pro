/**
 * MediCare Pro - Google Cloud / Firebase login.
 * Existing UI is intentionally unchanged.
 */

const loginButton = document.getElementById("loginBtn");
const loginForm = document.getElementById("loginForm");
const googleButton = document.querySelector(".social-btn");
const forgotPasswordLink = document.querySelector(".label-row a");

async function waitForCloud() {
    for (let attempt = 0; attempt < 80; attempt += 1) {
        if (window.MediCareCloud) return window.MediCareCloud;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error("Google Cloud services are not ready.");
}

async function loginWithEmail() {
    if (!window.MediCareAuth.ensureFirebaseReady()) return;

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    try {
        const cloud = await waitForCloud();
        const credential = await cloud.signInWithEmailAndPassword(cloud.auth, email, password);
        const profile = await window.MediCareAuth.getUserProfile(credential.user.uid);

        if (!profile) {
            await window.MediCareAuth.saveUserProfile(credential.user.uid, {
                email: credential.user.email || email,
                role: "patient",
                accountStatus: "active"
            });
            window.MediCareAuth.redirectByRole("patient");
            return;
        }

        if (profile.accountStatus === "suspended") {
            await cloud.signOut(cloud.auth);
            alert("This account is currently suspended. Please contact MediCare support.");
            return;
        }

        if ((profile.role === "doctor" || profile.role === "pharmacist") && profile.accountStatus === "pending_verification") {
            await cloud.signOut(cloud.auth);
            alert("Your account is awaiting verification. You can sign in after your professional credentials are verified.");
            return;
        }

        window.MediCareAuth.redirectByRole(profile.role || "patient");
    } catch (error) {
        window.MediCareAuth.showCloudError(error);
    }
}

loginButton?.addEventListener("click", loginWithEmail);
loginForm?.addEventListener("submit", event => {
    event.preventDefault();
    loginWithEmail();
});

googleButton?.addEventListener("click", async () => {
    if (!window.MediCareAuth.ensureFirebaseReady()) return;

    try {
        const cloud = await waitForCloud();
        const credential = await cloud.signInWithPopup(cloud.auth, cloud.googleProvider);
        let profile = await window.MediCareAuth.getUserProfile(credential.user.uid);

        if (!profile) {
            profile = {
                email: credential.user.email || "",
                name: credential.user.displayName || "",
                role: "patient",
                accountStatus: "active",
                authProvider: "google"
            };
            await window.MediCareAuth.saveUserProfile(credential.user.uid, profile);
        }

        window.MediCareAuth.redirectByRole(profile.role || "patient");
    } catch (error) {
        window.MediCareAuth.showCloudError(error);
    }
});

forgotPasswordLink?.addEventListener("click", async event => {
    event.preventDefault();
    if (!window.MediCareAuth.ensureFirebaseReady()) return;

    const email = document.getElementById("email")?.value.trim();
    if (!email) {
        alert("Enter your email address first.");
        return;
    }

    try {
        const cloud = await waitForCloud();
        await cloud.sendPasswordResetEmail(cloud.auth, email);
        alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
        window.MediCareAuth.showCloudError(error);
    }
});
