/*
 * MediCare Pro - Google Cloud / Firebase configuration
 * Project: medisphere-662a8
 *
 * This is the public Firebase Web App configuration.
 * It does NOT contain any service-account private key.
 */
const firebaseConfig = {
    apiKey: "AIzaSyCgudJrraYZQ5GldJChYJnBvPLUtDEuuuM",
    authDomain: "medisphere-662a8.firebaseapp.com",
    projectId: "medisphere-662a8",
    storageBucket: "medisphere-662a8.firebasestorage.app",
    messagingSenderId: "526980753878",
    appId: "1:526980753878:web:8aade9aedde53fbada5c77",
    measurementId: "G-ESZ778H0M7"
};

window.MediCareFirebaseConfig = firebaseConfig;
window.MediCareFirebaseReady = Object.values(firebaseConfig).every(
    value => value && !String(value).startsWith("YOUR_")
);
