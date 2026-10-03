/* Pharmacy registration using Google Firebase Authentication + Firestore. */

const pharmacistForm = document.getElementById("pharmacistForm");

pharmacistForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!window.MediCareAuth.ensureFirebaseReady()) return;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const pharmacyName = document.getElementById("pharmacyName").value.trim();
    const license = document.getElementById("license").value.trim();
    const pharmacyType = document.getElementById("pharmacyType").value;
    const address = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    if (!name || !email || !phone || !pharmacyName || !license || !pharmacyType || !address || !password) {
        alert("Please fill all fields");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    if (!terms) {
        alert("Please accept Terms & Conditions");
        return;
    }

    try {
        const cloud = window.MediCareCloud;
        const credential = await cloud.createUserWithEmailAndPassword(cloud.auth, email, password);

        await window.MediCareAuth.saveUserProfile(credential.user.uid, {
            role: "pharmacist",
            name,
            email,
            phone,
            pharmacyName,
            license,
            pharmacyType,
            address,
            accountStatus: "pending_verification",
            profileComplete: true
        });

        await cloud.setDoc(cloud.doc(cloud.db, "pharmacyProfiles", credential.user.uid), {
            uid: credential.user.uid,
            name,
            email,
            phone,
            pharmacyName,
            license,
            pharmacyType,
            address,
            verificationStatus: "pending",
            active: false,
            createdAt: cloud.serverTimestamp()
        });

        alert("Pharmacy registration submitted. Verification is required before fulfilling prescriptions.");
        await cloud.signOut(cloud.auth);
        window.location.href = "../index.html";
    } catch (error) {
        window.MediCareAuth.showCloudError(error);
    }
});
