/* Patient registration using Google Firebase Authentication + Firestore. */

const patientForm = document.getElementById("patientForm");

patientForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!window.MediCareAuth.ensureFirebaseReady()) return;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const dob = document.getElementById("dob").value;
    const gender = document.getElementById("gender").value;
    const address = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    if (!name || !email || !phone || !dob || !gender || !address || !password) {
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
            role: "patient",
            name,
            email,
            phone,
            dob,
            gender,
            address,
            accountStatus: "active",
            profileComplete: true
        });

        alert("Patient account created successfully!");
        window.MediCareAuth.redirectByRole("patient");
    } catch (error) {
        window.MediCareAuth.showCloudError(error);
    }
});
