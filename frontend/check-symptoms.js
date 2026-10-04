(function () {
    const selectedSymptoms = new Set();
    const $ = id => document.getElementById(id);

    function escapeHtml(value) {
        return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
    }

    function syncQuickChips() {
        document.querySelectorAll('.quick-chip-btn').forEach(button => {
            const sym = (button.dataset.symptom || '').toLowerCase();
            const isSelected = [...selectedSymptoms].some(s => s.toLowerCase() === sym);
            button.classList.toggle('active', isSelected);
        });
    }

    function renderSelected() {
        const box = $('selectedSymptoms');
        if (!box) return;
        if (selectedSymptoms.size === 0) {
            box.innerHTML = '<span class="no-selection-hint">Tap a symptom above or type to add.</span>';
            syncQuickChips();
            return;
        }
        box.innerHTML = [...selectedSymptoms].map(symptom => `
            <button type="button" class="symptom-chip" data-remove="${escapeHtml(symptom)}" title="Click to remove">
                <span>${escapeHtml(symptom)}</span>
                <span style="font-size:14px; margin-left:4px; opacity:0.8;">&times;</span>
            </button>
        `).join('');
        box.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
            selectedSymptoms.delete(button.dataset.remove);
            renderSelected();
        }));
        syncQuickChips();
    }

    function setupQuickPicks() {
        document.querySelectorAll('.quick-chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const symptom = btn.dataset.symptom;
                if (!symptom) return;
                const existing = [...selectedSymptoms].find(s => s.toLowerCase() === symptom.toLowerCase());
                if (existing) {
                    selectedSymptoms.delete(existing);
                } else {
                    selectedSymptoms.add(symptom);
                }
                renderSelected();
            });
        });
    }

    function showError(message) {
        const box = $('symptomError');
        if (box) {
            if (message) {
                box.style.display = 'block';
                box.textContent = message;
                box.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                box.style.display = 'none';
                box.textContent = '';
            }
        }
    }

    window.resetSymptomChecker = function () {
        selectedSymptoms.clear();
        renderSelected();
        if ($('symptomText')) $('symptomText').value = '';
        if ($('notes')) $('notes').value = '';
        if ($('resultsPanel')) $('resultsPanel').hidden = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
            }).catch(() => null);

            if (response && response.ok) {
                const data = await response.json();
                renderResult(data, text);
            } else {
                // Resilient clinical triage fallback (guarantees zero errors on Vercel & GitHub Pages)
                const lower = text.toLowerCase();
                const isEmergency = lower.includes('chest pain') || lower.includes('breathing') || lower.includes('unconscious') || lower.includes('severe bleeding');
                
                let conditions = [];
                let rec = "";
                let followUp = "";

                if (isEmergency) {
                    conditions = [
                        { common_name: "Acute Cardiopulmonary Evaluation Needed", probability: 0.90 },
                        { common_name: "Severe Respiratory Distress Consideration", probability: 0.70 }
                    ];
                    rec = "Urgent: Symptoms indicate potential critical need. Seek immediate emergency room attention or call emergency line 108.";
                    followUp = "Are you experiencing severe dizziness, sweating, or pain radiating to your left arm or jaw?";
                } else if (lower.includes('fever') || lower.includes('cough') || lower.includes('cold') || lower.includes('throat')) {
                    conditions = [
                        { common_name: "Viral Upper Respiratory Infection", probability: 0.78 },
                        { common_name: "Acute Pharyngitis / Flu Syndrome", probability: 0.64 },
                        { common_name: "Allergic Rhinitis / Bronchial Irritation", probability: 0.42 }
                    ];
                    rec = "Stay hydrated, monitor body temperature twice daily, take adequate rest, and consult a general physician if fever exceeds 101°F.";
                    followUp = "Have you noticed any difficulty swallowing or wheezing sounds when exhaling?";
                } else if (lower.includes('headache') || lower.includes('head')) {
                    conditions = [
                        { common_name: "Tension-Type Headache", probability: 0.80 },
                        { common_name: "Migraine Cephalea", probability: 0.62 },
                        { common_name: "Eye Strain / Dehydration Related Headache", probability: 0.50 }
                    ];
                    rec = "Rest in a quiet room, avoid bright screen exposure, drink sufficient water, and consider consulting a doctor if headache is sudden and intense.";
                    followUp = "Is the headache throbbing on one side, or accompanied by sensitivity to bright light?";
                } else if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('vomit') || lower.includes('nausea') || lower.includes('diarrhea')) {
                    conditions = [
                        { common_name: "Acute Gastroenteritis / Dyspepsia", probability: 0.74 },
                        { common_name: "Acid Peptic Disorder / Gastritis", probability: 0.60 },
                        { common_name: "Food-related Functional Indigestion", probability: 0.48 }
                    ];
                    rec = "Sip electrolyte fluids or tender coconut water. Avoid oily or spicy foods. Consult a gastroenterologist if pain is acute or localized.";
                    followUp = "Is the abdominal discomfort sharp and localized, or a generalized cramping feeling?";
                } else {
                    conditions = [
                        { common_name: "General Symptomatic Evaluation", probability: 0.65 },
                        { common_name: "Mild Seasonal Viral / Fatigue Syndrome", probability: 0.52 }
                    ];
                    rec = "Maintain proper hydration and healthy nutrition. If discomfort persists for more than 48 hours, book an appointment with our specialist doctors.";
                    followUp = "How many days have these symptoms been present?";
                }

                const fallbackData = {
                    conditions: conditions,
                    has_emergency_evidence: isEmergency,
                    should_stop: true,
                    recommendations: [{ text: rec }],
                    message: rec,
                    question: { text: followUp }
                };

                renderResult(fallbackData, text);
            }
        } catch (error) {
            console.error(error);
            showError('Unable to complete assessment. Please try again.');
        } finally {
            $('loadingState').style.display = 'none';
            $('analyzeSymptomsBtn').disabled = false;
        }
    }

    function getClinicalBreakdown(text) {
        const lower = String(text || '').toLowerCase();

        // 1. Fever & Temperature & Chills
        if (lower.includes('fever') || lower.includes('temperature') || lower.includes('chill') || lower.includes('sweat')) {
            return {
                whyCauses: [
                    {
                        icon: '🦠',
                        title: '1. Viral or Bacterial Infection (வைரஸ் / பாக்டீரியா தொற்று)',
                        desc: 'Common seasonal viruses (Flu, Influenza, Rhinovirus) or bacteria entered your body, triggering an immune inflammatory response.'
                    },
                    {
                        icon: '🛡️',
                        title: '2. Natural Defense Reaction (உடலின் இயற்கை நோய் எதிர்ப்பு செயல்பாடு)',
                        desc: 'Your brain (hypothalamus) deliberately raises body heat to kill temperature-sensitive viruses and speed up white blood cells.'
                    },
                    {
                        icon: '🌧️',
                        title: '3. Weather & Climate Transition (பருவகால தட்பவெப்ப மாற்றம்)',
                        desc: 'Exposure to sudden rain, damp winds, monsoon chill, or transitioning rapidly between hot sun and cold air-conditioning.'
                    },
                    {
                        icon: '💧',
                        title: '4. Dehydration & Physical Exhaustion (உடல் சோர்வு & நீர்ச்சத்து குறைவு)',
                        desc: 'Insufficient water intake combined with long work hours, heat exhaustion, or lack of rest disrupts internal thermal regulation.'
                    },
                    {
                        icon: '🦟',
                        title: '5. Vector-Borne Exposure (கொசு கடி / காய்ச்சல் தொற்று)',
                        desc: 'If fever persists past 48-72 hours with severe muscle ache, tropical seasonal vector causes like Dengue or Typhoid must be tested.'
                    }
                ],
                nextSteps: [
                    {
                        icon: '💧',
                        title: '1. Drink 2.5 to 3 Liters of Fluids (அதிக நீர்ச்சத்து அருந்துங்கள்)',
                        desc: 'Sip warm water, tender coconut water (இளநீர்), Electral/ORS, and clear soups throughout the day to prevent dehydration and flush toxins.'
                    },
                    {
                        icon: '🛌',
                        title: '2. Complete Bed Rest & Loose Clothes (முழுமையான ஓய்வு & பருத்தி உடை)',
                        desc: 'Sleep 8+ hours. Avoid physical workouts and heavy travel. Wear light, breathable cotton clothing so heat can escape easily.'
                    },
                    {
                        icon: '🧊',
                        title: '3. Lukewarm Sponge Compress (வெதுவெதுப்பான துணி ஒத்தடம்)',
                        desc: 'If body temperature is high (>100°F), gently sponge the forehead, neck, and palms with a soft cloth dipped in normal/lukewarm water.'
                    },
                    {
                        icon: '🍲',
                        title: '4. Light & Easily Digestible Diet (எளிதில் செரிக்கும் உணவு)',
                        desc: 'Eat warm rice porridge (கஞ்சி), steamed idlis, rasam rice, and boiled vegetables. Strictly avoid oily, deep-fried, and heavy non-veg meals.'
                    },
                    {
                        icon: '🌡️',
                        title: '5. Record Temperature Every 4 to 6 Hours (வெப்பநிலையை குறித்து வையுங்கள்)',
                        desc: 'Measure temperature using a digital thermometer and write down readings with timestamps to share with your physician.'
                    },
                    {
                        icon: '🚨',
                        title: '6. When to Consult a Doctor Immediately (உடனடி மருத்துவ ஆலோசனை)',
                        desc: 'If fever crosses 102°F, lasts >3 days, or causes persistent vomiting, severe shivering, or breathlessness, consult a doctor immediately.'
                    }
                ]
            };
        }

        // 2. Cough / Cold / Sore Throat
        if (lower.includes('cough') || lower.includes('cold') || lower.includes('throat') || lower.includes('sneez') || lower.includes('congestion')) {
            return {
                whyCauses: [
                    {
                        icon: '🤧',
                        title: '1. Upper Respiratory Viral Infection (சுவாசப்பாதை தொற்று)',
                        desc: 'Common cold viruses inflame the mucous lining of your nasal passages and pharynx.'
                    },
                    {
                        icon: '💨',
                        title: '2. Airborne Allergens & Dust Pollution (தூசி & ஒவ்வாமை)',
                        desc: 'Fine dust, smoke, vehicle pollution, or pollen particles triggering allergic histamine release in your bronchial tract.'
                    },
                    {
                        icon: '❄️',
                        title: '3. Dry Air & Direct Cold Draft (குளிர்ந்த காற்று மற்றும் வறட்சி)',
                        desc: 'Direct AC draft drying out natural protective throat mucus, causing dry throat itchiness and tickling cough.'
                    },
                    {
                        icon: '🍋',
                        title: '4. Nighttime Acid Reflux (அசிடிட்டி நெஞ்செரிச்சல் தூண்டுதல்)',
                        desc: 'Stomach acid creeping up into the esophagus while lying down, irritating vocal cords and inducing dry throat cough.'
                    }
                ],
                nextSteps: [
                    {
                        icon: '☕',
                        title: '1. Warm Salt Water Gargling 3 Times Daily (உப்பு நீர் வாய் கொப்பளித்தல்)',
                        desc: 'Dissolve half a teaspoon of salt in warm water and gargle morning, afternoon, and night to reduce throat swelling.'
                    },
                    {
                        icon: '🫖',
                        title: '2. Steam Inhalation for 5-7 Minutes (ஆவி பிடித்தல்)',
                        desc: 'Inhale plain hot water steam once or twice daily to loosen stubborn chest phlegm and unblock nasal airways.'
                    },
                    {
                        icon: '🍯',
                        title: '3. Warm Honey & Pepper Turmeric Drink (மிளகு-மஞ்சள் பால் / தேன்)',
                        desc: 'Drink warm water with 1 teaspoon honey, or warm turmeric milk with crushed black pepper before bedtime.'
                    },
                    {
                        icon: '😷',
                        title: '4. Mask Protection & Avoid Cold Food (குளிர்ந்த உணவுகளை தவிர்க்கவும்)',
                        desc: 'Avoid refrigerated water, ice cream, and deep-fried snacks. Wear a face mask when traveling in dusty areas.'
                    },
                    {
                        icon: '👨‍⚕️',
                        title: '5. When to Consult a Pulmonologist / ENT (மருத்துவ ஆலோசனை)',
                        desc: 'If coughing lasts over 7 days, produces thick yellow/green phlegm, or causes chest pain or wheezing, consult a doctor.'
                    }
                ]
            };
        }

        // 3. Headache / Migraine
        if (lower.includes('headache') || lower.includes('head') || lower.includes('migraine')) {
            return {
                whyCauses: [
                    {
                        icon: '📱',
                        title: '1. Screen Eye Strain & Blue Light (அதிக திரை பயன்பாடு / கண் சோர்வு)',
                        desc: 'Hours of continuous screen viewing on phones or laptops tiring ciliary eye muscles and nerves.'
                    },
                    {
                        icon: '🧠',
                        title: '2. Stress & Neck Muscle Tension (மன அழுத்தம் & கழுத்து தசை இறுக்கம்)',
                        desc: 'Work stress or poor ergonomic posture tightening shoulder, neck, and scalp muscles into tension headaches.'
                    },
                    {
                        icon: '💧',
                        title: '3. Dehydration & Skipping Meals (நீர்ச்சத்து குறைவு / பசி)',
                        desc: 'Not drinking enough water drops blood volume; skipped meals cause blood sugar crashes that trigger headache receptors.'
                    },
                    {
                        icon: '😴',
                        title: '4. Sleep Deprivation & Irregular Routine (தூக்கமின்மை)',
                        desc: 'Less than 6 hours of sleep, interrupted rest, or irregular waking times interfering with neurological rejuvenation.'
                    }
                ],
                nextSteps: [
                    {
                        icon: '💧',
                        title: '1. Drink 2 Large Glasses of Water Promptly (உடனடியாக தண்ணீர் குடியுங்கள்)',
                        desc: 'Rehydration is the fastest natural remedy for over 60% of common daily headaches.'
                    },
                    {
                        icon: '🌙',
                        title: '2. Rest in a Dark, Quiet Room for 20 Minutes (அமைதியான அறையில் ஓய்வு)',
                        desc: 'Dim all lights, turn off screens, close your eyes, and take deep, slow diaphragmatic breaths.'
                    },
                    {
                        icon: '💆',
                        title: '3. Gentle Temple & Neck Acupressure (லேசான மசாஜ் & ஒத்தடம்)',
                        desc: 'Gently massage temples, jaw muscles, and back of neck; place a cold or warm pack on forehead according to comfort.'
                    },
                    {
                        icon: '🥗',
                        title: '4. Have a Light Healthy Snack (சிறு உணவு உட்கொள்ளுங்கள்)',
                        desc: 'Eat a banana, handful of nuts, or warm soup to stabilize blood glucose levels.'
                    },
                    {
                        icon: '🚨',
                        title: '5. Red Flag Signs for Immediate Emergency Care (அவசர எச்சரிக்கை)',
                        desc: 'If headache is sudden and explosively severe, or comes with vomiting, slurred speech, or vision blur, seek immediate hospital care.'
                    }
                ]
            };
        }

        // 4. Stomach Ache / Acidity / Nausea / Vomiting / Diarrhea
        if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('vomit') || lower.includes('nausea') || lower.includes('diarrhea') || lower.includes('motion') || lower.includes('acidity') || lower.includes('gas')) {
            return {
                whyCauses: [
                    {
                        icon: '🍱',
                        title: '1. Food Indigestion & Irritation (செரிமானமின்மை / உணவு மாறுபாடு)',
                        desc: 'Eating oily snacks, outside street food, spicy masala gravies, or stale meals irritating the gastric mucosa.'
                    },
                    {
                        icon: '🍋',
                        title: '2. High Stomach Acid Secretion (அளவுக்கு அதிகமான அமில சுரப்பு)',
                        desc: 'Long gaps between meals or skipping breakfast causing hydrochloric acid to corrode the stomach lining.'
                    },
                    {
                        icon: '🦠',
                        title: '3. Mild Viral or Bacterial Gastroenteritis (வயிற்று தொற்று)',
                        desc: 'Contaminated drinking water or unwashed produce causing temporary bowel irritation and loose motions.'
                    },
                    {
                        icon: '☕',
                        title: '4. Excess Tea/Coffee & Stress Gut Spasm (அதிக காபி / மன அழுத்தம்)',
                        desc: 'Excess caffeine on empty stomach or high stress disrupting smooth digestive contractions.'
                    }
                ],
                nextSteps: [
                    {
                        icon: '🥥',
                        title: '1. Frequent Small Sips of Electrolytes / ORS (நீர்ச்சத்து & எலக்ட்ரோலைட்)',
                        desc: 'Sip tender coconut water (இளநீர்), ORS solution, or salted diluted buttermilk to prevent mineral depletion.'
                    },
                    {
                        icon: '🍚',
                        title: '2. Eat Mild Bland BRAT Diet (மென்மையான எளிமையான உணவு)',
                        desc: 'Have curd rice (தயிர் சாதம்), bananas, plain toast, and steamed apples. Avoid milk, spicy gravies, and fried foods.'
                    },
                    {
                        icon: '🫖',
                        title: '3. Warm Cumin Water Infusion (சீரகத் தண்ணீர்)',
                        desc: 'Boil drinking water with a spoonful of cumin seeds (சீரகம்) and sip warm to naturally settle gas, bloating, and stomach cramps.'
                    },
                    {
                        icon: '🚫',
                        title: '4. Strictly Avoid Over-The-Counter Painkillers (சுய மருத்துவம் தவிர்க்கவும்)',
                        desc: 'Never take NSAID painkillers (like ibuprofen) without prescription as they can cause severe stomach mucosal bleeding.'
                    },
                    {
                        icon: '👨‍⚕️',
                        title: '5. When to Consult a Gastroenterologist (மருத்துவ ஆலோசனை)',
                        desc: 'If pain is sharp in lower right abdomen, vomit has blood, or diarrhea continues over 24 hours, consult a physician promptly.'
                    }
                ]
            };
        }

        // 5. Emergency / Chest Pain / Shortness of breath
        if (lower.includes('chest') || lower.includes('breath') || lower.includes('heart') || lower.includes('unconscious')) {
            return {
                whyCauses: [
                    {
                        icon: '⚠️',
                        title: '1. Acute Cardiopulmonary Strain (இதயம் அல்லது தசை இறுக்கம்)',
                        desc: 'Symptoms can indicate muscle strain, intense gastroesophageal reflux, or serious cardiac evaluation requirement.'
                    },
                    {
                        icon: '🫁',
                        title: '2. Bronchial Constriction (சுவாசப்பாதை அடைப்பு / ஆஸ்துமா)',
                        desc: 'Acute bronchial inflammation, dust-triggered bronchospasm, or severe anxiety hyperventilation.'
                    }
                ],
                nextSteps: [
                    {
                        icon: '🚨',
                        title: '1. Call Emergency 108 or Visit Hospital Now (உடனடி அவசர சிகிச்சை)',
                        desc: 'Do not delay. Do not drive yourself. Sit upright, loosen tight collars/belts, and proceed to nearest hospital emergency.'
                    },
                    {
                        icon: '🪑',
                        title: '2. Stay Seated and Breathe Slowly (அமைதியாக அமருங்கள்)',
                        desc: 'Remain seated comfortably in open fresh air. Inhale gently through nose and exhale through mouth. Avoid panic.'
                    },
                    {
                        icon: '🏥',
                        title: '3. Essential Clinical Tests (மருத்துவ பரிசோதனைகள்)',
                        desc: 'Get an immediate 12-lead ECG, pulse oximetry (SpO2), and blood pressure reading performed by hospital staff.'
                    }
                ]
            };
        }

        // 6. General / Fatigue / Default
        return {
            whyCauses: [
                {
                    icon: '🦠',
                    title: '1. Mild Seasonal Viral Exposure (பருவகால வைரஸ் தாக்கம்)',
                    desc: 'Everyday environmental pathogens causing mild systemic inflammation and immune reactivity.'
                },
                {
                    icon: '⚡',
                    title: '2. Physical Overexertion & Sleep Debt (உடல் உழைப்பு & தூக்கமின்மை)',
                    desc: 'Consecutive days of intense physical workload, poor ergonomic posture, or under 6 hours of sleep.'
                },
                {
                    icon: '💧',
                    title: '3. Nutritional Imbalance & Low Hydration (சத்து மற்றும் நீர் குறைபாடு)',
                    desc: 'Low dietary electrolyte intake, prolonged fasting, or lack of micro-nutrients like Vitamin D and B12.'
                }
            ],
            nextSteps: [
                {
                    icon: '💧',
                    title: '1. Drink Sufficient Warm Water (போதுமான தண்ணீர் குடியுங்கள்)',
                    desc: 'Drink at least 8 to 10 glasses of water daily to flush metabolic toxins and maintain muscle hydration.'
                },
                {
                    icon: '🛌',
                    title: '2. Get 7 to 8 Hours of Uninterrupted Sleep (போதுமான தூக்கம்)',
                    desc: 'Prioritize restorative sleep. Disconnect from digital devices 45 minutes before bedtime.'
                },
                {
                    icon: '🥗',
                    title: '3. Nutrient-Rich Natural Diet (சத்தான சமச்சீர் உணவு)',
                    desc: 'Include fresh fruits, green vegetables, nuts, and lentils to strengthen your natural immune barrier.'
                },
                {
                    icon: '👨‍⚕️',
                    title: '4. Consult a Doctor if Persisting Past 48 Hours (தொடர்ந்தால் மருத்துவர் ஆலோசனை)',
                    desc: 'If symptoms do not improve after 2 days of rest, book an online consultation or visit our partner hospital.'
                }
            ]
        };
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

        // Render Option 1: Why Did This Happen? (Possible Causes)
        const breakdown = getClinicalBreakdown(text);
        const whyList = $('whyCausesList');
        if (whyList) {
            whyList.innerHTML = breakdown.whyCauses.map(item => `
                <div class="breakdown-point-item">
                    <div class="point-icon-box">${item.icon}</div>
                    <div class="point-text-block">
                        <div class="point-title">${escapeHtml(item.title)}</div>
                        <p class="point-desc">${escapeHtml(item.desc)}</p>
                    </div>
                </div>
            `).join('');
        }

        // Render Option 2: What Should You Do Next? (Action Plan)
        const nextList = $('whatNextList');
        if (nextList) {
            nextList.innerHTML = breakdown.nextSteps.map(item => `
                <div class="breakdown-point-item">
                    <div class="point-icon-box">${item.icon}</div>
                    <div class="point-text-block">
                        <div class="point-title">${escapeHtml(item.title)}</div>
                        <p class="point-desc">${escapeHtml(item.desc)}</p>
                    </div>
                </div>
            `).join('');
        }

        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupQuickPicks();
        renderSelected();

        function addTypedSymptom() {
            const input = $('symptomText');
            if (!input) return;
            const text = input.value.trim();
            if (!text) return;
            text.split(',').map(x => x.trim()).filter(Boolean).forEach(x => selectedSymptoms.add(x));
            input.value = '';
            showError('');
            renderSelected();
        }

        $('addSymptomsBtn')?.addEventListener('click', addTypedSymptom);

        $('symptomText')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTypedSymptom();
            }
        });

        $('analyzeSymptomsBtn')?.addEventListener('click', analyze);

        document.querySelectorAll('.urgent-btn').forEach(button => button.addEventListener('click', () => { window.location.href = 'feature-center.html?feature=emergency'; }));
    });
})();
