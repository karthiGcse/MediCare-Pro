// Search

const searchInput = document.getElementById("searchInput");

if (searchInput) {
    searchInput.addEventListener("input", function () {
        console.log("Searching:", searchInput.value);
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


// Notification Button

const notificationButton = document.querySelector(".notification");

if (notificationButton) {

    notificationButton.addEventListener("click", function () {

        alert("You have new health notifications.");

    });

}


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
