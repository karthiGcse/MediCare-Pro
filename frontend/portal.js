/* Shared real-data portal helpers. */

(async function () {
    for (let i = 0; i < 100 && !window.MediCareCloud; i += 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!window.MediCareCloud) return;

    const cloud = window.MediCareCloud;
    cloud.onAuthStateChanged(cloud.auth, async user => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        const profile = await window.MediCareAuth.getUserProfile(user.uid);
        if (!profile) {
            window.location.href = "index.html";
            return;
        }

        window.MediCarePortal = { user, profile, cloud };
        document.querySelectorAll("[data-user-name]").forEach(el => {
            el.textContent = profile.name || user.email || "User";
        });
        document.querySelectorAll("[data-user-role]").forEach(el => {
            el.textContent = profile.role || "user";
        });

        document.querySelector("[data-signout]")?.addEventListener("click", async () => {
            await cloud.signOut(cloud.auth);
            window.location.href = "index.html";
        });

        document.dispatchEvent(new CustomEvent("medicare:portal-ready", { detail: { user, profile, cloud } }));
    });
})();

window.portalEscape = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
