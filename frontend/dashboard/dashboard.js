// Search Integration
const searchInput = document.getElementById("searchInput");

if (searchInput) {
    searchInput.addEventListener("focus", function () {
        openGlobalSearch(searchInput.value);
    });
    searchInput.addEventListener("input", function () {
        openGlobalSearch(searchInput.value);
    });
}


// Symptom Checker Button

const symptomButton = document.getElementById("symptomButton");

if (symptomButton) {
    symptomButton.addEventListener("click", function () {
        alert("Symptom Checker will open here.");
    });
}


// Quick Action Buttons

const quickActions = document.querySelectorAll(".quick-action");

quickActions.forEach(function (button) {

    button.addEventListener("click", function () {

        const action = button.innerText;

        console.log(action + " clicked");

    });

});


// Service Cards
const serviceCards = document.querySelectorAll(".service-card");

serviceCards.forEach(function (card) {
    card.addEventListener("click", function () {
        const serviceName = card.getAttribute("aria-label") || "Service";
        console.log(serviceName + " clicked");

        // Toggle active glowing card state
        serviceCards.forEach(function (c) {
            c.classList.remove("service-card-active");
        });
        card.classList.add("service-card-active");
    });

    card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            card.click();
        }
    });
});



// Bottom Navigation

const navItems = document.querySelectorAll(".nav-item");

navItems.forEach(function (item) {

    item.addEventListener("click", function () {

        navItems.forEach(function (nav) {
            nav.classList.remove("active");
        });

        item.classList.add("active");

    });

});


// =========================================
// ACTIVE NAVBAR: NOTIFICATIONS, LOCATION, SEARCH
// =========================================

// --- 1. TOAST NOTIFICATIONS ---
function showToast(message, icon = '📍') {
    let container = document.getElementById('medToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'medToastContainer';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'med-toast';
    toast.innerHTML = `<span style="font-size:18px;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// --- 2. NOTIFICATIONS SYSTEM ---
const navNotifBtn = document.getElementById('navNotificationBtn') || document.querySelector('.notification');
const notifDropdown = document.getElementById('notificationDropdown');
const notifBadge = document.getElementById('notifBadge');
const notifCountPill = document.getElementById('notifCountPill');
const notifMarkReadBtn = document.getElementById('notifMarkReadBtn');
const notifClearAllBtn = document.getElementById('notifClearAllBtn');
const notifList = document.getElementById('notifList');

function toggleNotificationDropdown(forceState) {
    if (!notifDropdown) return;
    const isShowing = typeof forceState === 'boolean' ? !forceState : notifDropdown.classList.contains('show');
    if (isShowing) {
        notifDropdown.classList.remove('show');
    } else {
        // Close other dropdowns
        toggleLocationDropdown(false);
        notifDropdown.classList.add('show');
    }
}

if (navNotifBtn) {
    navNotifBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleNotificationDropdown();
    });
}

if (notifMarkReadBtn) {
    notifMarkReadBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (notifList) {
            notifList.querySelectorAll('.notif-item').forEach(item => item.classList.remove('unread'));
        }
        if (notifBadge) notifBadge.style.display = 'none';
        if (notifCountPill) notifCountPill.textContent = '0 New';
        showToast('All notifications marked as read', '✓');
    });
}

if (notifClearAllBtn) {
    notifClearAllBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (notifList) {
            notifList.innerHTML = `
                <div style="padding:28px 18px; text-align:center; color:#94a3b8;">
                    <div style="font-size:32px; margin-bottom:8px;">📭</div>
                    <div style="font-size:14px; font-weight:600; color:#64748b;">No new notifications</div>
                    <div style="font-size:12px; margin-top:4px;">You're all caught up with your healthcare updates!</div>
                </div>
            `;
        }
        if (notifBadge) notifBadge.style.display = 'none';
        if (notifCountPill) notifCountPill.textContent = '0 New';
        showToast('Notifications cleared', '🗑️');
    });
}

// --- 3. LOCATION PICKER SYSTEM ---
const navLocationBtn = document.getElementById('navLocationBtn') || document.querySelector('.user-location');
const locationDropdown = document.getElementById('locationDropdown');
const currentCityText = document.getElementById('currentCityText');
const locSearchInput = document.getElementById('locSearchInput');
const locCityList = document.getElementById('locCityList');
const locGpsBtn = document.getElementById('locGpsBtn');

const TAMIL_NADU_CITIES = [
    { name: "Erode", state: "Tamil Nadu", tag: "District HQ • Kongu Region" },
    { name: "Coimbatore", state: "Tamil Nadu", tag: "Healthcare & Textile Hub" },
    { name: "Chennai", state: "Tamil Nadu", tag: "State Capital • Super Speciality Hospitals" },
    { name: "Salem", state: "Tamil Nadu", tag: "Speciality Clinics • Steel City" },
    { name: "Madurai", state: "Tamil Nadu", tag: "South TN Referral Center" },
    { name: "Tiruchirappalli (Trichy)", state: "Tamil Nadu", tag: "Central TN Medical Network" },
    { name: "Tiruppur", state: "Tamil Nadu", tag: "Nearby Erode • District Health" },
    { name: "Dindigul", state: "Tamil Nadu", tag: "South TN Health Network" },
    { name: "Thanjavur", state: "Tamil Nadu", tag: "Delta Region Medical Hub" },
    { name: "Vellore", state: "Tamil Nadu", tag: "CMC & Speciality Care" },
    { name: "Bengaluru", state: "Karnataka", tag: "Speciality & Research Hospitals" }
];

let selectedCity = localStorage.getItem('medicare_selected_city') || 'Erode';

function renderCityList(filter = '') {
    if (!locCityList) return;
    const q = filter.trim().toLowerCase();
    const filtered = TAMIL_NADU_CITIES.filter(c => 
        c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q)
    );

    if (!filtered.length) {
        locCityList.innerHTML = `<div style="padding:16px; text-align:center; font-size:12px; color:#94a3b8;">No cities found matching "${filter}"</div>`;
        return;
    }

    locCityList.innerHTML = filtered.map(c => {
        const isCurrent = c.name.toLowerCase() === selectedCity.toLowerCase() || (selectedCity.includes(c.name));
        return `
            <div class="loc-city-item ${isCurrent ? 'active' : ''}" data-city="${c.name}">
                <div>
                    <div><span class="city-pin">📍</span><strong>${c.name}</strong></div>
                    <div style="font-size:11px; color:#64748b; margin-top:2px;">${c.tag}</div>
                </div>
                ${isCurrent ? '<span class="city-check">✓</span>' : ''}
            </div>
        `;
    }).join('');

    locCityList.querySelectorAll('.loc-city-item').forEach(el => {
        el.addEventListener('click', function (e) {
            e.stopPropagation();
            const city = el.dataset.city;
            selectCity(city);
        });
    });
}

function selectCity(cityName) {
    selectedCity = cityName;
    localStorage.setItem('medicare_selected_city', cityName);
    if (currentCityText) currentCityText.textContent = cityName;
    renderCityList(locSearchInput ? locSearchInput.value : '');
    toggleLocationDropdown(false);
    showToast(`Location set to ${cityName}. Doctors & services updated!`, '📍');
}

function toggleLocationDropdown(forceState) {
    if (!locationDropdown) return;
    const isShowing = typeof forceState === 'boolean' ? !forceState : locationDropdown.classList.contains('show');
    if (isShowing) {
        locationDropdown.classList.remove('show');
        if (navLocationBtn) navLocationBtn.classList.remove('active');
    } else {
        // Close other dropdowns
        toggleNotificationDropdown(false);
        locationDropdown.classList.add('show');
        if (navLocationBtn) navLocationBtn.classList.add('active');
        renderCityList();
        if (locSearchInput) {
            locSearchInput.value = '';
            setTimeout(() => locSearchInput.focus(), 50);
        }
    }
}

if (navLocationBtn) {
    navLocationBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleLocationDropdown();
    });
}

if (locSearchInput) {
    locSearchInput.addEventListener('input', function () {
        renderCityList(locSearchInput.value);
    });
}

if (locGpsBtn) {
    locGpsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        locGpsBtn.innerHTML = '<span>⏳</span> Locating your GPS...';
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    locGpsBtn.innerHTML = '<span>🎯</span> Detect Current Location (GPS)';
                    selectCity('Erode');
                    showToast('GPS Detected: Erode, Tamil Nadu (Accuracy: High)', '🎯');
                },
                () => {
                    locGpsBtn.innerHTML = '<span>🎯</span> Detect Current Location (GPS)';
                    selectCity('Erode');
                    showToast('Defaulting to Erode, Tamil Nadu', '📍');
                },
                { timeout: 4000 }
            );
        } else {
            locGpsBtn.innerHTML = '<span>🎯</span> Detect Current Location (GPS)';
            selectCity('Erode');
        }
    });
}

// Initial city restoration on load
if (selectedCity && currentCityText) {
    currentCityText.textContent = selectedCity;
}

// --- 4. GLOBAL SPOTLIGHT SEARCH SYSTEM ---
const navSearchBtn = document.getElementById('navSearchBtn');
const searchModalOverlay = document.getElementById('searchModalOverlay');
const globalSearchInput = document.getElementById('globalSearchInput');
const searchCloseBtn = document.getElementById('searchCloseBtn');
const searchFilterPills = document.getElementById('searchFilterPills');
const searchResultsList = document.getElementById('searchResultsList');
const searchResultCount = document.getElementById('searchResultCount');

const SEARCH_DIRECTORY = [
    // Doctors
    { type: 'doctor', title: 'Dr. A. Sundaram, MD, DM', desc: 'Senior Consultant Physician • Apollo Hospitals, Chennai', badge: 'Doctor', link: '../appointments.html?doc=sundaram', icon: '🩺' },
    { type: 'doctor', title: 'Dr. S. Rajasekaran, MS, MCh', desc: 'Chief Orthopedic Surgeon • Ganga Medical Centre, Coimbatore', badge: 'Doctor', link: '../appointments.html?doc=rajasekaran', icon: '🩺' },
    { type: 'doctor', title: 'Dr. Meenakshi Sundaram', desc: 'Senior Nephrologist • Meenakshi Mission Hospital, Madurai', badge: 'Doctor', link: '../appointments.html?doc=meenakshi', icon: '🩺' },
    { type: 'doctor', title: 'Dr. Devi Prasad Shetty', desc: 'Chief Cardiac Surgeon • Narayana Health City, Bangalore', badge: 'Doctor', link: '../appointments.html?doc=shetty', icon: '🩺' },
    { type: 'doctor', title: 'Dr. Pratima Murthy', desc: 'Senior Neuropsychiatrist • NIMHANS, Bangalore', badge: 'Doctor', link: '../appointments.html?doc=murthy', icon: '🩺' },
    { type: 'doctor', title: 'Dr. G. Mohan', desc: 'Chief Consultant Physician • Manipal Hospital, Salem', badge: 'Doctor', link: '../appointments.html?doc=mohan', icon: '🩺' },

    // Medicines
    { type: 'medicine', title: 'Paracetamol 650mg (Dolo / Calpol)', desc: 'Antipyretic & Analgesic • Apollo Pharmacy 24x7', badge: 'Medicine', link: '../medicines.html?q=paracetamol', icon: '💊' },
    { type: 'medicine', title: 'Pantoprazole 40mg (Pan 40)', desc: 'Proton Pump Inhibitor (Gastro & Acidity Relief)', badge: 'Medicine', link: '../medicines.html?q=pantoprazole', icon: '💊' },
    { type: 'medicine', title: 'Amoxicillin 500mg (Augmentin)', desc: 'Broad-spectrum Antibiotic • Prescription Required', badge: 'Medicine', link: '../medicines.html?q=amoxicillin', icon: '💊' },
    { type: 'medicine', title: 'Metformin 500mg', desc: 'Type-2 Diabetes Management • Verified Formulations', badge: 'Medicine', link: '../medicines.html?q=metformin', icon: '💊' },
    { type: 'medicine', title: 'Azithromycin 500mg', desc: 'Upper Respiratory Tract Antibiotic', badge: 'Medicine', link: '../medicines.html?q=azithromycin', icon: '💊' },

    // Tests
    { type: 'test', title: 'Complete Blood Count (CBC)', desc: '24 Parameters • Free Home Sample Collection in Erode', badge: 'Lab Test', link: '../lab-tests.html?test=cbc', icon: '🧪' },
    { type: 'test', title: 'Lipid Profile & Cholesterol Test', desc: 'Heart Health Screening • Fasting 10-12 hrs required', badge: 'Lab Test', link: '../lab-tests.html?test=lipid', icon: '🧪' },
    { type: 'test', title: 'HbA1c Diabetes Monitoring', desc: '3-Month Blood Glucose Average Assessment', badge: 'Lab Test', link: '../lab-tests.html?test=hba1c', icon: '🧪' },
    { type: 'test', title: 'Thyroid Panel (T3, T4, TSH)', desc: 'Complete Endocrine Hormonal Profile', badge: 'Lab Test', link: '../lab-tests.html?test=thyroid', icon: '🧪' },

    // Services
    { type: 'service', title: 'Check Symptoms (AI Guidance)', desc: 'Analyze symptoms with real clinical database', badge: 'Service', link: '../check-symptoms.html', icon: '🩺' },
    { type: 'service', title: 'Digital Prescription Scanner (OCR)', desc: 'Scan and extract prescription medicines with phone camera', badge: 'Service', link: '../prescription-scanner.html', icon: '📷' },
    { type: 'service', title: 'Live Telemedicine Video Consult', desc: 'Connect with certified clinicians over instant video', badge: 'Service', link: '../telemedicine.html', icon: '🎥' },
    { type: 'service', title: 'Global Telemedicine Network', desc: 'International consultations & second medical opinions', badge: 'Service', link: '../global-telemedicine.html', icon: '🌐' },
    { type: 'service', title: 'Hospital Queue Waiting Times', desc: 'Real-time queue tokens and estimated waiting times', badge: 'Service', link: '../hospital-queue.html', icon: '⏱️' },
    { type: 'service', title: 'Government & Private Health Insurance', desc: 'CMCHIS Tamil Nadu & cashless policy integration', badge: 'Service', link: '../insurance.html', icon: '🛡️' },
    { type: 'service', title: 'Blood Bank & Donor Availability', desc: 'Live blood unit stock by district in Tamil Nadu', badge: 'Service', link: '../blood.html', icon: '🩸' },
    { type: 'service', title: 'Family Health Hub', desc: 'Manage health records of parents, spouse & children', badge: 'Service', link: '../family-health.html', icon: '👨‍👩‍👧' },
    { type: 'service', title: 'Wearable Integration & Vitals Sync', desc: 'Sync Apple Health, Fitbit, and Google Health Connect', badge: 'Service', link: '../wearables.html', icon: '⌚' },

    // Hospitals
    { type: 'hospital', title: 'Apollo Hospitals Greams Road, Chennai', desc: 'Multi-speciality & JCI Accredited Referral Hospital', badge: 'Hospital', link: '../appointments.html?hospital=apollo', icon: '🏥' },
    { type: 'hospital', title: 'Ganga Hospital & Medical Centre, Coimbatore', desc: 'World renowned Orthopedics, Trauma & Plastic Surgery', badge: 'Hospital', link: '../appointments.html?hospital=ganga', icon: '🏥' },
    { type: 'hospital', title: 'Meenakshi Mission Hospital, Madurai', desc: '1000-bed super speciality tertiary care hospital', badge: 'Hospital', link: '../appointments.html?hospital=meenakshi', icon: '🏥' }
];

let currentFilter = 'all';

function renderSearchResults(query = '', filter = 'all') {
    if (!searchResultsList) return;
    const q = query.trim().toLowerCase();

    let matches = SEARCH_DIRECTORY;
    if (filter !== 'all') {
        matches = matches.filter(item => item.type === filter);
    }
    if (q) {
        matches = matches.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.desc.toLowerCase().includes(q) ||
            item.badge.toLowerCase().includes(q)
        );
    }

    if (searchResultCount) {
        searchResultCount.textContent = `${matches.length} result(s) found`;
    }

    if (!matches.length) {
        searchResultsList.innerHTML = `
            <div style="padding:40px 20px; text-align:center; color:#94a3b8;">
                <div style="font-size:36px; margin-bottom:8px;">🔍</div>
                <div style="font-size:15px; font-weight:600; color:#475569;">No health services found matching "${query}"</div>
                <div style="font-size:13px; margin-top:4px;">Try searching for doctors, paracetamol, lab tests or hospital queue.</div>
            </div>
        `;
        return;
    }

    searchResultsList.innerHTML = matches.map(item => `
        <a href="${item.link}" class="search-res-item">
            <div class="search-res-left">
                <div class="search-res-icon">${item.icon}</div>
                <div>
                    <h4 class="search-res-title">${item.title}</h4>
                    <p class="search-res-desc">${item.desc}</p>
                </div>
            </div>
            <span class="search-res-badge">${item.badge}</span>
        </a>
    `).join('');
}

function openGlobalSearch(initialQuery = '') {
    if (!searchModalOverlay) return;
    searchModalOverlay.style.display = 'flex';
    toggleNotificationDropdown(false);
    toggleLocationDropdown(false);
    if (globalSearchInput) {
        globalSearchInput.value = initialQuery;
        setTimeout(() => globalSearchInput.focus(), 40);
    }
    renderSearchResults(initialQuery, currentFilter);
}

function closeGlobalSearch() {
    if (!searchModalOverlay) return;
    searchModalOverlay.style.display = 'none';
}

if (navSearchBtn) {
    navSearchBtn.addEventListener('click', function () {
        openGlobalSearch();
    });
}

if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', closeGlobalSearch);
}

if (searchModalOverlay) {
    searchModalOverlay.addEventListener('click', function (e) {
        if (e.target === searchModalOverlay) closeGlobalSearch();
    });
}

if (globalSearchInput) {
    globalSearchInput.addEventListener('input', function () {
        renderSearchResults(globalSearchInput.value, currentFilter);
    });
}

if (searchFilterPills) {
    searchFilterPills.querySelectorAll('.search-filter-pill').forEach(pill => {
        pill.addEventListener('click', function () {
            searchFilterPills.querySelectorAll('.search-filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            renderSearchResults(globalSearchInput ? globalSearchInput.value : '', currentFilter);
        });
    });
}

// Global Keyboard Shortcuts (Ctrl+K or / to open search, Esc to close all)
document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        openGlobalSearch();
    } else if (e.key === 'Escape') {
        closeGlobalSearch();
        toggleNotificationDropdown(false);
        toggleLocationDropdown(false);
    }
});

// Click outside dropdowns to close them
document.addEventListener('click', function (e) {
    if (notifDropdown && notifDropdown.classList.contains('show')) {
        if (!notifDropdown.contains(e.target) && (!navNotifBtn || !navNotifBtn.contains(e.target))) {
            toggleNotificationDropdown(false);
        }
    }
    if (locationDropdown && locationDropdown.classList.contains('show')) {
        if (!locationDropdown.contains(e.target) && (!navLocationBtn || !navLocationBtn.contains(e.target))) {
            toggleLocationDropdown(false);
        }
    }
});




// Advertisement Sliding Carousel

const adTrack = document.querySelector(".ad-track");
const adItems = document.querySelectorAll(".ad-item");
const adDots = document.querySelectorAll(".ad-dot");

let adIndex = 0;

function getVisibleAdsCount() {
    if (window.innerWidth <= 767) return 1;
    if (window.innerWidth <= 1199) return 2;
    return 3;
}

function getCarouselStep() {
    const visibleAds = getVisibleAdsCount();
    return visibleAds === 1 ? 1 : visibleAds === 2 ? 2 : 3;
}

function updateAdCarousel() {
    if (!adTrack || adItems.length === 0) return;

    const visibleAds = getVisibleAdsCount();
    const step = getCarouselStep();
    const maxIndex = Math.max(0, adItems.length - visibleAds);
    const boundedIndex = Math.min(adIndex, maxIndex);

    const firstItem = adItems[0];
    const trackGap = parseFloat(window.getComputedStyle(adTrack).gap) || 10;
    const slideOffset = (firstItem.offsetWidth + trackGap) * boundedIndex;

    adTrack.style.transition = "transform 0.6s ease";
    adTrack.style.transform = "translateX(-" + slideOffset + "px)";

    adDots.forEach(function (dot) {
        const dotIndex = Number(dot.dataset.index || 0);
        dot.classList.toggle("active", dotIndex === boundedIndex);
    });

    adIndex = boundedIndex;
    if (step > 1 && boundedIndex + step >= adItems.length) {
        adIndex = 0;
    }
}

function slideAds() {
    if (!adTrack || adItems.length === 0) return;

    const visibleAds = getVisibleAdsCount();
    const step = getCarouselStep();
    const maxIndex = Math.max(0, adItems.length - visibleAds);

    adIndex += step;
    if (adIndex > maxIndex) {
        adIndex = 0;
    }

    updateAdCarousel();
}

if (adTrack && adItems.length > 0) {
    let adInterval = setInterval(slideAds, 3500);

    const banner = adTrack.closest(".health-banner");
    if (banner) {
        banner.addEventListener("mouseenter", function () {
            clearInterval(adInterval);
        });
        banner.addEventListener("mouseleave", function () {
            clearInterval(adInterval);
            adInterval = setInterval(slideAds, 3500);
        });
    }

    window.addEventListener("resize", function () {
        updateAdCarousel();
    });

    adDots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
            adIndex = i;
            updateAdCarousel();
        });
    });
}


// Symptom checker interactions
const symptomInput = document.getElementById("symptomInput");
const addSymptomBtn = document.getElementById("addSymptomBtn");
const symptomChipContainer = document.getElementById("symptomChipContainer");
const durationSelect = document.getElementById("durationSelect");
const severitySelect = document.getElementById("severitySelect");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultCard = document.getElementById("analysisResult");

let selectedSymptoms = [];

function renderSymptoms() {
    if (!symptomChipContainer) return;

    symptomChipContainer.innerHTML = "";

    selectedSymptoms.forEach(function (symptom) {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.innerHTML = symptom + ' <button type="button" aria-label="Remove ' + symptom + '">×</button>';

        const removeButton = chip.querySelector("button");
        removeButton.addEventListener("click", function () {
            selectedSymptoms = selectedSymptoms.filter(function (item) {
                return item !== symptom;
            });
            renderSymptoms();
        });

        symptomChipContainer.appendChild(chip);
    });
}

if (addSymptomBtn && symptomInput && symptomChipContainer) {
    addSymptomBtn.addEventListener("click", function () {
        const values = symptomInput.value
            .split(",")
            .map(function (item) {
                return item.trim();
            })
            .filter(function (item) {
                return item.length > 0;
            });

        if (values.length === 0) {
            symptomInput.focus();
            return;
        }

        values.forEach(function (entry) {
            const normalized = entry.replace(/\s+/g, " ");
            if (!selectedSymptoms.includes(normalized)) {
                selectedSymptoms.push(normalized);
            }
        });

        symptomInput.value = "";
        renderSymptoms();
    });
}

if (analyzeBtn && resultCard) {
    analyzeBtn.addEventListener("click", function () {
        const selectedDuration = durationSelect ? durationSelect.value : "3 days";
        const selectedSeverity = severitySelect ? severitySelect.value : "Moderate";
        const symptomList = document.querySelectorAll("#analysisResult .result-list li");
        const categoryList = document.querySelectorAll("#analysisResult .tag-list li");
        const durationValue = document.querySelector("#analysisResult strong:nth-of-type(1)");
        const severityValue = document.querySelectorAll("#analysisResult strong")[1];

        if (symptomList.length) {
            symptomList.forEach(function (item) {
                item.remove();
            });
        }

        if (categoryList.length) {
            categoryList.forEach(function (item) {
                item.remove();
            });
        }

        const results = document.querySelector("#analysisResult .result-list");
        const categories = document.querySelector("#analysisResult .tag-list");

        selectedSymptoms.forEach(function (symptom) {
            const item = document.createElement("li");
            item.textContent = "✓ " + symptom;
            results.appendChild(item);
        });

        const categoryItems = [
            "Common viral illness",
            "Respiratory infection",
            "Other possible causes"
        ];

        categoryItems.forEach(function (category) {
            const item = document.createElement("li");
            item.textContent = category;
            categories.appendChild(item);
        });

        if (durationValue) {
            durationValue.textContent = selectedDuration;
        }

        if (severityValue) {
            severityValue.textContent = selectedSeverity;
        }

        resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
}

renderSymptoms();

// --- Hash Navigation Handler (Routes #records or #medicines to live pages) ---
function handleHashNavigation() {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash === '#records' || hash === '#record') {
        window.location.href = '../health-records.html';
    } else if (hash === '#medicines' || hash === '#medicine') {
        window.location.href = '../medicines.html';
    }
}
handleHashNavigation();
window.addEventListener('hashchange', handleHashNavigation);
