/*
 * Live dashboard data layer.
 * Existing dashboard markup/styles remain in place; this file only replaces
 * hard-coded account/appointment information with Firestore data.
 */

(async function initializeCloudDashboard() {
    for (let attempt = 0; attempt < 100 && !window.MediCareCloud; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!window.MediCareCloud) return;

    const cloud = window.MediCareCloud;

    cloud.onAuthStateChanged(cloud.auth, async user => {
        if (!user) {
            window.location.href = "../index.html";
            return;
        }

        try {
            const profile = await window.MediCareAuth.getUserProfile(user.uid);
            if (!profile) {
                window.location.href = "../index.html";
                return;
            }

            renderProfile(profile, user);
            await renderRoleData(profile, user);
        } catch (error) {
            console.error("Dashboard data error:", error);
        }
    });

    function renderProfile(profile, user) {
        const welcomeTitle = document.querySelector(".welcome-text h1");
        const welcomeSmall = document.querySelector(".welcome-small");
        const welcomeDescription = document.querySelector(".welcome-text > p:last-child");
        const profileButton = document.querySelector(".profile-button");

        const displayName = profile.name || user.displayName || user.email?.split("@")[0] || "User";
        const role = profile.role || "patient";

        if (welcomeSmall) welcomeSmall.textContent = role.toUpperCase() + " PORTAL";
        if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${displayName}!`;
        if (welcomeDescription) welcomeDescription.textContent = getRoleDescription(role);
        if (profileButton) {
            profileButton.addEventListener("click", () => showProfile(profile, user));
        }

        const appointmentCard = document.querySelector(".appointment-card");
        if (appointmentCard) {
            appointmentCard.dataset.userRole = role;
        }
    }

    function getRoleDescription(role) {
        if (role === "doctor") return "Manage verified patient consultations, appointments and prescriptions.";
        if (role === "pharmacist") return "Manage verified prescriptions, inventory and pharmacy orders.";
        if (role === "admin") return "Monitor verification, access and platform workflows.";
        return "Your health journey is just a few clicks away.";
    }

    async function renderRoleData(profile, user) {
        if (profile.role === "doctor") {
            await renderDoctorData(user.uid);
        } else if (profile.role === "pharmacist") {
            await renderPharmacyData(user.uid);
        } else if (profile.role === "admin") {
            await renderAdminData();
        } else {
            await renderPatientData(user.uid);
        }
    }

    async function renderPatientData(uid) {
        let appointments = await getDocsByField("appointments", "patientId", uid);
        
        // Also check local storage appointments for seamless instant booking reflection
        try {
            const localApts = JSON.parse(localStorage.getItem('medicare_local_appointments') || '[]');
            if (localApts && localApts.length) {
                appointments = [...localApts, ...appointments];
            }
        } catch (_) {}

        renderAppointments(appointments, "patient");

        const prescriptions = await getDocsByField("prescriptions", "patientId", uid);
        if (prescriptions.length) {
            renderStatusSection("My Prescriptions", prescriptions, prescription =>
                `${escapeHtml(prescription.medicineName || "Prescription")} — ${escapeHtml(prescription.status || "active")}`
            );
        }

        const orders = await getDocsByField("orders", "patientId", uid);
        if (orders.length) {
            renderStatusSection("Medicine Orders", orders, order =>
                `Order ${escapeHtml(order.orderNumber || order.id)} — ${escapeHtml(order.status || "pending")}`
            );
        }
    }

    async function renderDoctorData(uid) {
        const appointments = await getDocsByField("appointments", "doctorId", uid);
        renderAppointments(appointments, "doctor");

        const prescriptions = await getDocsByField("prescriptions", "doctorId", uid);
        renderStatusSection("Recent Prescriptions", prescriptions, prescription =>
            `${escapeHtml(prescription.medicineName || "Prescription")} — ${escapeHtml(prescription.status || "active")}`
        );
    }

    async function renderPharmacyData(uid) {
        const orders = await getDocsByField("orders", "pharmacyId", uid);
        renderAppointments(orders, "pharmacy", "orders");

        const inventory = await getDocsByField("pharmacyInventory", "pharmacyId", uid);
        renderStatusSection("Inventory", inventory, item =>
            `${escapeHtml(item.medicineName || "Medicine")} — ${escapeHtml(String(item.quantity ?? 0))} available`
        );
    }

    async function renderAdminData() {
        renderStatusSection("Admin Controls", [], () => "Use Firestore verification workflows to manage verified accounts.");
    }

    async function getDocsByField(collectionName, field, value) {
        try {
            const snapshot = await cloud.getDocs(
                cloud.query(
                    cloud.collection(cloud.db, collectionName),
                    cloud.where(field, "==", value),
                    cloud.limit(50)
                )
            );
            return snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
        } catch (_) {
            return [];
        }
    }

    function renderAppointments(records, role, type = "appointments") {
        const card = document.getElementById("mainAppointmentCard") || document.querySelector(".appointment-card");
        if (!card) return;

        // If patient has custom booked records, update the active card details dynamically
        if (records && records.length) {
            const first = records[0];
            const docNameEl = document.getElementById("dashDocName");
            const docSpecEl = document.getElementById("dashDocSpecialty");
            
            if (docNameEl) {
                docNameEl.textContent = first.doctorName || first.displayName?.text || "Consultant Doctor";
            }
            if (docSpecEl) {
                docSpecEl.textContent = first.hospital || first.formattedAddress || "Verified Hospital & Clinic";
            }
        }
    }

    function renderStatusSection(title, records, formatter) {
        // If there are no live records, do NOT inject empty state boxes into the UI
        if (!records || !records.length) return;

        const appointmentSection = document.getElementById("appointments");
        if (!appointmentSection || !appointmentSection.parentElement) return;

        let section = document.querySelector(`[data-cloud-section="${title}"]`);
        if (!section) {
            section = document.createElement("section");
            section.className = "dashboard-section cloud-data-section";
            section.dataset.cloudSection = title;
            section.innerHTML = `
                <div class="section-title"><h2></h2></div>
                <div class="cloud-record-list"></div>
            `;
            appointmentSection.parentElement.insertBefore(section, appointmentSection.nextElementSibling);
        }

        section.querySelector("h2").textContent = title;
        const list = section.querySelector(".cloud-record-list");
        list.innerHTML = records.slice(0, 6).map(formatter).map(text =>
            `<div class="cloud-record-row"><span>${text}</span></div>`
        ).join("");
    }

    function showProfile(profile, user) {
        const details = [
            ["Name", profile.name || user.displayName || "—"],
            ["Email", profile.email || user.email || "—"],
            ["Role", profile.role || "—"],
            ["Account", profile.accountStatus || "active"]
        ];
        alert(details.map(([label, value]) => `${label}: ${value}`).join("\n"));
    }

    function formatTimestamp(value) {
        if (!value) return "";
        if (typeof value.toDate === "function") return value.toDate().toLocaleString();
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
})();

// Route existing dashboard cards into the live feature center without changing their design.
document.addEventListener('DOMContentLoaded', () => {
    const serviceRoutes = {
        'Image Diagnosis': '../image-diagnosis.html',
        'Mental Health': '../mental-health.html',
        'Telemedicine': '../telemedicine.html',
        'Global Telemedicine': '../global-telemedicine.html',
        'Home Lab Test': '../lab-tests.html',
        'Hospital Queue': '../hospital-queue.html',
        'Insurance': '../insurance.html',
        'Nutrition Planner': '../nutrition.html',
        'Blood Donation': '../blood.html'
    };

    document.querySelectorAll('.service-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent?.trim();
        const route = serviceRoutes[title];
        if (!route) return;
        
        const targetUrl = route.endsWith('.html') ? route : `../feature-center.html?feature=${encodeURIComponent(route)}`;
        
        card.style.cursor = 'pointer';
        card.addEventListener('click', event => {
            if (event.target.closest('a,button')) return;
            window.location.href = targetUrl;
        });
        card.querySelector('.service-action-link')?.addEventListener('click', event => {
            event.preventDefault();
            window.location.href = targetUrl;
        });
    });

    const quickRoutes = {
        'Find Medicines': '../medicines.html',
        'My Prescriptions': '../prescription-scanner.html',
        'Find a Doctor': '../appointments.html',
        'Book Appointment': '../appointments.html',
        'Lab Tests': '../lab-tests.html'
    };

    document.querySelectorAll('.quick-action').forEach(card => {
        const title = card.querySelector('h3')?.textContent?.trim();
        const route = quickRoutes[title];
        if (!route) return;
        card.addEventListener('click', () => { window.location.href = route; });
    });
});

// Role workflows: approvals, prescriptions and pharmacy fulfilment are cloud records.
document.addEventListener('medicare:portal-ready', async ({detail}) => {
    const {user, profile, cloud} = detail;
    const anchor = document.getElementById('appointments');
    if (!anchor?.parentElement) return;
    const section = document.createElement('section');
    section.className = 'dashboard-section cloud-data-section';
    section.innerHTML = '<div class="section-title"><h2>Role Workspace</h2></div><div class="cloud-role-workspace">Loading live records...</div>';
    anchor.parentElement.appendChild(section);
    const box = section.querySelector('.cloud-role-workspace');
    const esc = window.portalEscape || (v => String(v ?? ''));

    async function records(collectionName, field, value) {
        const snap = await cloud.getDocs(cloud.query(cloud.collection(cloud.db, collectionName), cloud.where(field, '==', value), cloud.limit(50)));
        return snap.docs.map(d => ({id:d.id, ...d.data()}));
    }

    if (profile.role === 'doctor') {
        const appointments = await records('appointments','doctorId',user.uid);
        box.innerHTML = appointments.length ? appointments.map(a => `<div class="cloud-record-row"><span>Appointment — ${esc(a.appointmentDate || '')} — ${esc(a.status || 'requested')}</span><button class="cloud-action-button" data-approve="${a.id}">Approve</button><button class="cloud-action-button" data-prescribe="${a.id}">Prescription</button></div>`).join('') : '<div class="cloud-empty-state">No appointment records found.</div>';
        box.querySelectorAll('[data-approve]').forEach(b=>b.addEventListener('click',async()=>{await cloud.updateDoc(cloud.doc(cloud.db,'appointments',b.dataset.approve),{status:'confirmed',confirmedAt:cloud.serverTimestamp()});b.textContent='Confirmed';b.disabled=true;}));
        box.querySelectorAll('[data-prescribe]').forEach(b=>b.addEventListener('click',async()=>{const medicineName=prompt('Medicine name');if(!medicineName)return;const dosage=prompt('Dosage and instructions');if(!dosage)return;const appointment=appointments.find(a=>a.id===b.dataset.prescribe);await cloud.addDoc(cloud.collection(cloud.db,'prescriptions'),{patientId:appointment.patientId,doctorId:user.uid,medicineName,dosage,status:'active',createdAt:cloud.serverTimestamp()});b.textContent='Prescription saved';b.disabled=true;}));
        return;
    }

    if (profile.role === 'pharmacist') {
        const orders = await records('orders','pharmacyId',user.uid);
        box.innerHTML = `<div class="cloud-role-form"><input id="inventoryMedicine" placeholder="Medicine name"><input id="inventoryQty" type="number" min="0" placeholder="Quantity"><button class="cloud-action-button" id="addInventory">Add inventory</button></div>` + (orders.length ? orders.map(o=>`<div class="cloud-record-row"><span>Order ${esc(o.orderNumber||o.id)} — ${esc(o.status||'pending')}</span><button class="cloud-action-button" data-fulfil="${o.id}">Mark fulfilled</button></div>`).join('') : '<div class="cloud-empty-state">No live pharmacy orders found.</div>');
        box.querySelector('#addInventory')?.addEventListener('click',async()=>{const medicineName=box.querySelector('#inventoryMedicine').value.trim();const quantity=Number(box.querySelector('#inventoryQty').value);if(!medicineName||!Number.isFinite(quantity)||quantity<0)return;await cloud.addDoc(cloud.collection(cloud.db,'pharmacyInventory'),{pharmacyId:user.uid,medicineName,quantity,updatedAt:cloud.serverTimestamp()});box.querySelector('#inventoryMedicine').value='';box.querySelector('#inventoryQty').value='';alert('Inventory saved to cloud.');});
        box.querySelectorAll('[data-fulfil]').forEach(b=>b.addEventListener('click',async()=>{await cloud.updateDoc(cloud.doc(cloud.db,'orders',b.dataset.fulfil),{status:'fulfilled',fulfilledAt:cloud.serverTimestamp()});b.textContent='Fulfilled';b.disabled=true;}));
        return;
    }

    if (profile.role === 'admin') {
        box.innerHTML = '<a class="cloud-action-button" href="../feature-center.html?feature=admin">Open verification workspace</a>';
        return;
    }

    const [appointments,prescriptions,orders] = await Promise.all([records('appointments','patientId',user.uid),records('prescriptions','patientId',user.uid),records('orders','patientId',user.uid)]);
    box.innerHTML = `<div class="cloud-empty-state">${appointments.length} appointment(s), ${prescriptions.length} prescription(s), ${orders.length} order(s) in your cloud account.</div><div class="cloud-role-links"><a href="../prescription-scanner.html">Prescriptions</a><a href="../health-records.html">Health Records</a><a href="../family-health.html">Family Hub</a></div>`;
});
