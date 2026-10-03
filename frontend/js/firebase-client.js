/* Google Firebase client bootstrap for the static MediCare frontend. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

const config = window.MediCareFirebaseConfig;

if (!window.MediCareFirebaseReady) {
    console.warn("MediCare Firebase is not configured. Add your Google Firebase Web App configuration in frontend/js/firebase-config.js.");
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

window.MediCareCloud = {
    app,
    auth,
    db,
    storage,
    googleProvider,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    onSnapshot,
    ref,
    uploadBytes,
    getDownloadURL
};
