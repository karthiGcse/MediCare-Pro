/* Shared Firebase authentication and profile helpers. */

function showCloudError(error) {
    console.error("MediCare authentication error:", error);

    const code = error?.code || "";
    const messages = {
        "auth/email-already-in-use": "An account already exists with this email.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must contain at least 6 characters.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/popup-closed-by-user": "Google sign-in was cancelled.",
        "auth/popup-blocked": "Your browser blocked the Google sign-in window. Please allow popups and try again."
    };

    alert(messages[code] || error?.message || "Unable to complete the request.");
}

function ensureFirebaseReady() {
    if (!window.MediCareFirebaseReady) {
        alert("Google Cloud is not configured yet. Add the Firebase Web App configuration first.");
        return false;
    }
    return true;
}

async function saveUserProfile(uid, profile) {
    const cloud = window.MediCareCloud;
    await cloud.setDoc(
        cloud.doc(cloud.db, "users", uid),
        {
            ...profile,
            uid,
            updatedAt: cloud.serverTimestamp()
        },
        { merge: true }
    );
}

async function getUserProfile(uid) {
    const cloud = window.MediCareCloud;
    const user = cloud.auth.currentUser;
    if (!user || user.uid !== uid) {
        throw new Error("You must be signed in to load this account profile.");
    }

    const token = await user.getIdToken();
    const projectId = window.MediCareFirebaseConfig.projectId;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 404) return null;

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error?.message || "Unable to load your account profile.");
    }

    return Object.fromEntries(
        Object.entries(result.fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)])
    );
}

function decodeFirestoreValue(value) {
    if ("stringValue" in value) return value.stringValue;
    if ("integerValue" in value) return Number(value.integerValue);
    if ("doubleValue" in value) return value.doubleValue;
    if ("booleanValue" in value) return value.booleanValue;
    if ("nullValue" in value) return null;
    if ("timestampValue" in value) return value.timestampValue;
    if ("arrayValue" in value) {
        return (value.arrayValue.values || []).map(decodeFirestoreValue);
    }
    if ("mapValue" in value) {
        return Object.fromEntries(
            Object.entries(value.mapValue.fields || {}).map(([key, field]) => [key, decodeFirestoreValue(field)])
        );
    }
    return undefined;
}

function redirectByRole(role) {
    const isSubdir = window.location.pathname.includes("/sign-up/") || window.location.pathname.includes("/auth/");
    const prefix = isSubdir ? "../" : "";
    const target = role === "doctor"
        ? `${prefix}dashboard/dashboard.html?role=doctor`
        : role === "pharmacist"
            ? `${prefix}dashboard/dashboard.html?role=pharmacist`
            : `${prefix}dashboard/dashboard.html?role=patient`;

    window.location.href = target;
}

window.MediCareAuth = {
    ensureFirebaseReady,
    showCloudError,
    saveUserProfile,
    getUserProfile,
    redirectByRole
};
