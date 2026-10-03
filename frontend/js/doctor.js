/* Doctor registration using Google Firebase Authentication + Firestore. */

const doctorForm = document.getElementById("doctorForm");

doctorForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!window.MediCareAuth.ensureFirebaseReady()) return;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const license = document.getElementById("license").value.trim();
    const qualification = document.getElementById("qualification").value.trim();
    const specialization = document.getElementById("specialization").value;
    const experience = document.getElementById("experience").value;
    const clinic = document.getElementById("clinic").value.trim();
    const address = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    if (!name || !email || !phone || !license || !qualification || !specialization || !experience || !clinic || !address || !password) {
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
            role: "doctor",
            name,
            email,
            phone,
            license,
            qualification,
            specialization,
            experience,
            clinic,
            address,
            accountStatus: "pending_verification",
            profileComplete: true
        });

        await cloud.setDoc(cloud.doc(cloud.db, "doctorProfiles", credential.user.uid), {
            uid: credential.user.uid,
            name,
            email,
            phone,
            license,
            qualification,
            specialization,
            experience,
            clinic,
            address,
            verificationStatus: "pending",
            active: false,
            createdAt: cloud.serverTimestamp()
        });

        alert("Doctor registration submitted. Your credentials must be verified before accepting patients.");
        await cloud.signOut(cloud.auth);
        window.location.href = "../index.html";
    } catch (error) {
        window.MediCareAuth.showCloudError(error);
    }
});
