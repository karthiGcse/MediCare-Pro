(function () {
    const selectedSymptoms = new Set();
    const quickSymptoms = ['fever', 'cough', 'headache', 'sore throat', 'fatigue', 'nausea'];
    const $ = id => document.getElementById(id);

    function renderSelected() {
        const box = $('selectedSymptoms');
        if (!box) return;
        box.innerHTML = [...selectedSymptoms].map(symptom => `<button type="button" class="symptom-chip" data-remove="${escapeHtml(symptom)}">${escapeHtml(symptom)} ×</button>`).join('');
        box.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
            selectedSymptoms.delete(button.dataset.remove);
            renderSelected();
        }));
    }

    function escapeHtml(value) {
        return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
    }

    function setupQuickPicks() {
        const box = $('quickSymptoms');
        if (!box) return;
        box.innerHTML = quickSymptoms.map(s => `<button type="button" class="quick-chip" data-symptom="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('');
        box.querySelectorAll('[data-symptom]').forEach(button => button.addEventListener('click', () => {
            selectedSymptoms.add(button.dataset.symptom);
            renderSelected();
        }));
    }

    function showError(message) {
        const box = $('symptomError');
        if (box) box.textContent = message || '';
    }

    async function getToken() {
        for (let i = 0; i < 100 && !window.MediCareCloud; i++) await new Promise(r => setTimeout(r, 50));
        if (!window.MediCareCloud?.auth?.currentUser) throw new Error('Please sign in before using the symptom checker.');
        return window.MediCareCloud.auth.currentUser.getIdToken();
    }

    async function analyze() {
        showError('');
        const age = Number($('ageInput')?.value);
        const sex = $('sexInput')?.value;
        const typed = $('symptomText')?.value?.trim() || '';
        const notes = $('notes')?.value?.trim() || '';
        const text = [...selectedSymptoms, typed, notes].filter(Boolean).join('. ');
        if (!Number.isFinite(age) || age < 1 || age > 120) return showError('Please enter a valid age.');
        if (!text) return showError('Add at least one symptom.');

        $('loadingState').style.display = 'flex';
        $('analyzeSymptomsBtn').disabled = true;
        try {
            const token = await getToken();
            const response = await fetch('/api/symptoms/analyze', {
                method: 'POST',
                headers: {'Content-Type':'application/json', Authorization:`Bearer ${token}`},
                body: JSON.stringify({age, sex, text})
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'The live symptom service is unavailable.');
            renderResult(data, text);
        } catch (error) {
            console.error(error);
            showError(error.message || 'Unable to complete the live assessment.');
        } finally {
            $('loadingState').style.display = 'none';
            $('analyzeSymptomsBtn').disabled = false;
        }
    }

    function renderResult(data, text) {
        const panel = $('resultsPanel');
        panel.hidden = false;
        $('symptomSummary').textContent = text;
        const categories = $('categoriesList');
        const conditions = Array.isArray(data.conditions) ? data.conditions : [];
        categories.innerHTML = conditions.length ? conditions.slice(0, 8).map(c => `<li>${escapeHtml(c.common_name || c.name || 'Condition')} ${c.probability != null ? `(${Math.round(Number(c.probability) * 100)}%)` : ''}</li>`).join('') : '<li>No condition result was returned by the live service.</li>';
        const emergency = Boolean(data.has_emergency_evidence);
        $('riskValue').textContent = emergency ? 'Urgent evidence' : 'Preliminary';
        $('careSummary').textContent = data.should_stop ? 'Assessment complete' : 'Further assessment may be needed';
        $('urgencyText').textContent = emergency ? 'Seek urgent medical care based on the service response.' : 'This result is preliminary and does not replace a clinician.';
        $('guidanceText').textContent = data.message || (data.recommendations?.[0]?.text || 'Use the returned information as preliminary guidance only.');
        $('questionContainer').innerHTML = data.question ? `<div class="detail-card"><h3>Follow-up question</h3><p>${escapeHtml(data.question.text || data.question)}</p></div>` : '';
        if (data.recommendations?.length) $('alertText').textContent = data.recommendations.map(x => x.text || x).join(' ');
        panel.scrollIntoView({behavior:'smooth', block:'nearest'});
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupQuickPicks();
        renderSelected();
        $('addSymptomsBtn')?.addEventListener('click', () => {
            const text = $('symptomText').value;
            text.split(',').map(x => x.trim()).filter(Boolean).forEach(x => selectedSymptoms.add(x));
            $('symptomText').value = '';
            renderSelected();
        });
        $('analyzeSymptomsBtn')?.addEventListener('click', analyze);
        document.querySelectorAll('.urgent-btn').forEach(button => button.addEventListener('click', () => { window.location.href = 'feature-center.html?feature=emergency'; }));
        document.querySelectorAll('.action-card').forEach(button => button.addEventListener('click', () => {
            const title = button.querySelector('h4')?.textContent || '';
            if (title.includes('Doctor')) window.location.href='appointments.html';
            else if (title.includes('Appointment')) window.location.href='appointments.html';
            else if (title.includes('Telemedicine')) window.location.href='telemedicine.html';
        }));
    });
})();
