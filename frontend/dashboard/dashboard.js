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




// ==========================================
// ADVERTISEMENT AUTO-SCROLL CAROUSEL
// ==========================================
const adTrack = document.querySelector(".ad-track");
const adItems = document.querySelectorAll(".ad-item");
let adCurrentIndex = 0;
let adInterval = null;

function getVisibleAdsCount() {
    if (window.innerWidth <= 767) return 1;
    if (window.innerWidth <= 1199) return 2;
    return 3;
}

function getAdCarouselStep() {
    const visibleAds = getVisibleAdsCount();
    return visibleAds === 1 ? 1 : visibleAds === 2 ? 2 : 3;
}

function renderAdDots() {
    const dotsContainer = document.querySelector(".ad-dots");
    if (!dotsContainer) return;
    const visibleAds = getVisibleAdsCount();
    const step = getAdCarouselStep();
    const maxIndex = Math.max(0, adItems.length - visibleAds);

    dotsContainer.innerHTML = "";
    for (let i = 0; i <= maxIndex; i += step) {
        const dot = document.createElement("span");
        dot.className = "ad-dot";
        dot.dataset.index = String(i);
        if (i === adCurrentIndex || (i === 0 && adCurrentIndex < step)) {
            dot.classList.add("active");
        }
        dot.addEventListener("click", function () {
            adCurrentIndex = i;
            updateAdCarousel();
            restartAdTimer();
        });
        dotsContainer.appendChild(dot);
    }
}

function updateAdCarousel() {
    if (!adTrack || adItems.length === 0) return;

    const visibleAds = getVisibleAdsCount();
    const maxIndex = Math.max(0, adItems.length - visibleAds);

    if (adCurrentIndex > maxIndex) {
        adCurrentIndex = 0;
    } else if (adCurrentIndex < 0) {
        adCurrentIndex = maxIndex;
    }

    const firstItem = adItems[0];
    const trackGap = parseFloat(window.getComputedStyle(adTrack).gap) || 10;
    const itemWidth = firstItem.getBoundingClientRect().width;
    const slideOffset = (itemWidth + trackGap) * adCurrentIndex;

    adTrack.style.transition = "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
    adTrack.style.transform = "translateX(-" + slideOffset + "px)";

    const dots = document.querySelectorAll(".ad-dot");
    dots.forEach(function (dot) {
        const dotIndex = Number(dot.dataset.index || 0);
        const isActive = (visibleAds === 3)
            ? (dotIndex === 0 && adCurrentIndex < 3) || (dotIndex === 3 && adCurrentIndex >= 3)
            : (dotIndex === adCurrentIndex);
        dot.classList.toggle("active", isActive);
    });
}

function slideAds() {
    if (!adTrack || adItems.length === 0) return;

    const visibleAds = getVisibleAdsCount();
    const step = getAdCarouselStep();
    const maxIndex = Math.max(0, adItems.length - visibleAds);

    if (adCurrentIndex >= maxIndex) {
        adCurrentIndex = 0;
    } else {
        adCurrentIndex = Math.min(adCurrentIndex + step, maxIndex);
    }

    updateAdCarousel();
}

function startAdTimer() {
    if (adInterval) clearInterval(adInterval);
    adInterval = setInterval(function () {
        slideAds();
    }, 3000);
}

function stopAdTimer() {
    if (adInterval) {
        clearInterval(adInterval);
        adInterval = null;
    }
}

function restartAdTimer() {
    startAdTimer();
}

// Ensure auto-scroll starts immediately and resumes on tab visibility
if (adTrack && adItems.length > 0) {
    renderAdDots();
    updateAdCarousel();
    startAdTimer();

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            startAdTimer();
        }
    });

    const prevBtn = document.getElementById("adPrevBtn");
    const nextBtn = document.getElementById("adNextBtn");

    if (prevBtn) {
        prevBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const visibleAds = getVisibleAdsCount();
            const step = getAdCarouselStep();
            const maxIndex = Math.max(0, adItems.length - visibleAds);

            if (adCurrentIndex <= 0) {
                adCurrentIndex = maxIndex;
            } else {
                adCurrentIndex = Math.max(0, adCurrentIndex - step);
            }
            updateAdCarousel();
            restartAdTimer();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            slideAds();
            restartAdTimer();
        });
    }

    // Touch swipe support for mobile/tablets
    let touchStartX = 0;
    let touchEndX = 0;
    adTrack.addEventListener("touchstart", function (e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    adTrack.addEventListener("touchend", function (e) {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 40) {
            if (diff < 0) {
                slideAds();
            } else {
                const visibleAds = getVisibleAdsCount();
                const step = getAdCarouselStep();
                const maxIndex = Math.max(0, adItems.length - visibleAds);
                if (adCurrentIndex <= 0) {
                    adCurrentIndex = maxIndex;
                } else {
                    adCurrentIndex = Math.max(0, adCurrentIndex - step);
                }
                updateAdCarousel();
            }
            restartAdTimer();
        }
    }, { passive: true });

    window.addEventListener("resize", function () {
        renderAdDots();
        updateAdCarousel();
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

// --- Toast Notification Helper ---
function showToastMessage(msg) {
    let container = document.getElementById("medToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "medToastContainer";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "med-toast";
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// PATIENT PROFILE MODAL FUNCTIONALITY
// ==========================================
const DEFAULT_PATIENT_PROFILE = {
    name: "Karthi G",
    email: "karthiofficialcse@gmail.com",
    role: "patient",
    phone: "+91 98421 56789",
    blood: "O +ve",
    dob: "15 Jun 2002 (24 Yrs)",
    city: "Erode, Tamil Nadu",
    abha: "91-8201-4491-0192@abdm",
    insurance: "Chief Minister Comprehensive Health Insurance Scheme (CMCHIS - TN)",
    emergency: "S. Gunasekaran (Father) - +91 94432 11223"
};

function getStoredProfile() {
    try {
        const stored = localStorage.getItem("medicare_patient_profile");
        if (stored) {
            return { ...DEFAULT_PATIENT_PROFILE, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn("Could not read stored profile:", e);
    }
    return { ...DEFAULT_PATIENT_PROFILE };
}

function saveStoredProfile(data) {
    try {
        localStorage.setItem("medicare_patient_profile", JSON.stringify(data));
    } catch (e) {
        console.warn("Could not save profile:", e);
    }
}

window.openProfileModal = function (cloudProfile, cloudUser) {
    const modal = document.getElementById("myProfileModal");
    if (!modal) return;

    let profile = getStoredProfile();

    if (cloudProfile || cloudUser) {
        if (cloudProfile && cloudProfile.name) profile.name = cloudProfile.name;
        else if (cloudUser && cloudUser.displayName) profile.name = cloudUser.displayName;

        if (cloudProfile && cloudProfile.email) profile.email = cloudProfile.email;
        else if (cloudUser && cloudUser.email) profile.email = cloudUser.email;

        if (cloudProfile && cloudProfile.role) profile.role = cloudProfile.role;
        if (cloudProfile && cloudProfile.phone) profile.phone = cloudProfile.phone;
        if (cloudProfile && cloudProfile.bloodGroup) profile.blood = cloudProfile.bloodGroup;
        if (cloudProfile && cloudProfile.city) profile.city = cloudProfile.city;
        if (cloudProfile && cloudProfile.abhaId) profile.abha = cloudProfile.abhaId;
        if (cloudProfile && cloudProfile.insurance) profile.insurance = cloudProfile.insurance;
        if (cloudProfile && cloudProfile.emergencyContact) profile.emergency = cloudProfile.emergencyContact;
    }

    // Avatar initials
    const initials = (profile.name || "KG")
        .split(" ")
        .map(word => word[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "KG";

    const avatarCircle = document.getElementById("profAvatarCircle");
    if (avatarCircle) avatarCircle.textContent = initials;

    const nameDisplay = document.getElementById("profNameDisplay");
    if (nameDisplay) nameDisplay.textContent = profile.name;

    const emailDisplay = document.getElementById("profEmailDisplay");
    if (emailDisplay) emailDisplay.textContent = profile.email;

    const rolePill = document.getElementById("profRolePill");
    if (rolePill) {
        const role = (profile.role || "patient").toLowerCase();
        if (role === "doctor") rolePill.textContent = "👨‍⚕️ Verified Doctor";
        else if (role === "pharmacist") rolePill.textContent = "💊 Verified Pharmacist";
        else if (role === "admin") rolePill.textContent = "⚡ Administrator";
        else rolePill.textContent = "🟢 Verified Patient";
    }

    // Inputs
    const phoneInput = document.getElementById("profInputPhone");
    if (phoneInput) phoneInput.value = profile.phone || "";

    const bloodInput = document.getElementById("profInputBlood");
    if (bloodInput) bloodInput.value = profile.blood || "";

    const dobInput = document.getElementById("profInputDob");
    if (dobInput) dobInput.value = profile.dob || "";

    const cityInput = document.getElementById("profInputCity");
    if (cityInput) cityInput.value = profile.city || "";

    const abhaInput = document.getElementById("profInputAbha");
    if (abhaInput) abhaInput.value = profile.abha || "";

    const insInput = document.getElementById("profInputInsurance");
    if (insInput) insInput.value = profile.insurance || "";

    const emergInput = document.getElementById("profInputEmergency");
    if (emergInput) emergInput.value = profile.emergency || "";

    // Reset edit state
    window.cancelEditProfile();

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
};

window.closeProfileModal = function () {
    const modal = document.getElementById("myProfileModal");
    if (modal) {
        modal.style.display = "none";
    }
    document.body.style.overflow = "";
};

window.toggleEditProfile = function () {
    const editFields = [
        "profInputPhone",
        "profInputBlood",
        "profInputDob",
        "profInputCity",
        "profInputInsurance",
        "profInputEmergency"
    ];

    editFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = false;
            el.style.borderColor = "#10b981";
            el.style.backgroundColor = "#ffffff";
        }
    });

    const saveBar = document.getElementById("profSaveBar");
    if (saveBar) saveBar.style.display = "flex";

    const editBtn = document.getElementById("profEditBtn");
    if (editBtn) editBtn.style.display = "none";

    const phoneInput = document.getElementById("profInputPhone");
    if (phoneInput) phoneInput.focus();
};

window.cancelEditProfile = function () {
    const editFields = [
        "profInputPhone",
        "profInputBlood",
        "profInputDob",
        "profInputCity",
        "profInputInsurance",
        "profInputEmergency"
    ];

    const profile = getStoredProfile();

    if (document.getElementById("profInputPhone")) document.getElementById("profInputPhone").value = profile.phone;
    if (document.getElementById("profInputBlood")) document.getElementById("profInputBlood").value = profile.blood;
    if (document.getElementById("profInputDob")) document.getElementById("profInputDob").value = profile.dob;
    if (document.getElementById("profInputCity")) document.getElementById("profInputCity").value = profile.city;
    if (document.getElementById("profInputInsurance")) document.getElementById("profInputInsurance").value = profile.insurance;
    if (document.getElementById("profInputEmergency")) document.getElementById("profInputEmergency").value = profile.emergency;

    editFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = true;
            el.style.borderColor = "#e2e8f0";
            el.style.backgroundColor = "";
        }
    });

    const saveBar = document.getElementById("profSaveBar");
    if (saveBar) saveBar.style.display = "none";

    const editBtn = document.getElementById("profEditBtn");
    if (editBtn) editBtn.style.display = "inline-block";
};

window.saveProfileDetails = function (event) {
    if (event) event.preventDefault();

    const profile = getStoredProfile();

    const phone = document.getElementById("profInputPhone")?.value?.trim();
    const blood = document.getElementById("profInputBlood")?.value?.trim();
    const dob = document.getElementById("profInputDob")?.value?.trim();
    const city = document.getElementById("profInputCity")?.value?.trim();
    const insurance = document.getElementById("profInputInsurance")?.value?.trim();
    const emergency = document.getElementById("profInputEmergency")?.value?.trim();

    if (phone) profile.phone = phone;
    if (blood) profile.blood = blood;
    if (dob) profile.dob = dob;
    if (city) profile.city = city;
    if (insurance) profile.insurance = insurance;
    if (emergency) profile.emergency = emergency;

    saveStoredProfile(profile);

    // If city changed, update navbar location button if present
    const locBtnText = document.getElementById("locCurrentCity");
    if (locBtnText && city) {
        locBtnText.textContent = city.split(",")[0].trim();
    }

    window.cancelEditProfile();
    showToastMessage("✅ Profile details updated successfully!");
};

window.handleProfileSignOut = function () {
    if (confirm("Are you sure you want to sign out of MediCare Pro?")) {
        try {
            if (window.MediCareAuth && typeof window.MediCareAuth.signOut === "function") {
                window.MediCareAuth.signOut().then(() => {
                    window.location.href = "../index.html";
                }).catch(() => {
                    window.location.href = "../index.html";
                });
                return;
            }
        } catch (_) {}
        window.location.href = "../index.html";
    }
};

// Wire profile buttons on DOM ready
document.addEventListener("DOMContentLoaded", function () {
    const profileBtns = document.querySelectorAll(".profile-button");
    profileBtns.forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            window.openProfileModal();
        });
    });

    const profileModalEl = document.getElementById("myProfileModal");
    if (profileModalEl) {
        profileModalEl.addEventListener("click", function (e) {
            if (e.target === profileModalEl) {
                window.closeProfileModal();
            }
        });
    }
});

// Close modal on Escape
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        window.closeProfileModal();
    }
});
