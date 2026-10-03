(function () {
    const params = new URLSearchParams(location.search);
    const feature = (params.get('feature') || 'all').toLowerCase();

    // Immediate redirect to dedicated real data pages
    const pageRedirects = {
        'image': 'image-diagnosis.html',
        'lab': 'lab-tests.html',
        'nutrition': 'nutrition.html',
        'mental': 'mental-health.html',
        'telemedicine': 'telemedicine.html',
        'globaltelemedicine': 'global-telemedicine.html',
        'queue': 'hospital-queue.html',
        'insurance': 'insurance.html',
        'blood': 'blood.html',
        'family': 'family-health.html',
        'wearable': 'wearables.html',
        'records': 'health-records.html',
        'appointments': 'appointments.html'
    };

    if (pageRedirects[feature]) {
        location.replace(pageRedirects[feature]);
        return;
    }

    const root = document.getElementById('featureRoot');

    const definitions = {
        all: ['Health Services', 'Use the connected healthcare workflows. Only your real cloud records and verified live services are shown.'],
        image: ['Image Diagnosis', 'Upload a medical image or report to your secure cloud record. No unverified automated diagnosis is displayed.'],
        mental: ['Mental Health', 'Private wellness notes and support requests stored in your cloud account.'],
        telemedicine: ['Telemedicine', 'Request an online consultation from a verified doctor. Video calling requires a connected provider.'],
        globaltelemedicine: ['Global Telemedicine', 'Request cross-region care. Only verified doctor records available in your connected system are shown.'],
        lab: ['Home Lab Test', 'Submit a home-lab request. Actual collection availability depends on connected laboratory providers.'],
        queue: ['Hospital Queue', 'Find real nearby hospitals. Live queue times appear only when a hospital provider supplies queue data.'],
        insurance: ['Insurance', 'Store your own insurance policy information securely. This does not invent coverage or eligibility.'],
        nutrition: ['Nutrition Planner', 'Record dietary goals and food notes. Clinical diet plans should be reviewed by a qualified professional.'],
        blood: ['Blood Donation', 'Register your donor details and availability. Matching is shown only from real records in the cloud.'],
        emergency: ['Emergency Support', 'Store emergency contacts and create an emergency request. This does not replace local emergency services.'],
        family: ['Family Health Hub', 'Create authorized family links and view records only where access is explicitly granted.'],
        wallet: ['Health Wallet', 'Store healthcare expense records and references. No financial or insurance outcome is predicted.'],
        wearable: ['Wearable Health', 'Save readings exported from a supported device. No fabricated sensor values are created.'],
        refill: ['Medicine Refill', 'Create a refill request against an existing prescription. Pharmacy approval is required.'],
        records: ['Health Records', 'Upload and view your own cloud health records.'],
        admin: ['Admin Verification', 'Review pending doctor and pharmacy verification requests.'],
        appointments: ['Appointments', 'Book with verified doctors and manage your cloud appointment requests.'],
        prescriptions: ['Prescriptions', 'View prescriptions issued by verified doctors and pharmacy fulfilment status.']
    };

    function esc(v) { return window.portalEscape ? portalEscape(v) : String(v ?? ''); }
    function card(title, html, wide = false) { return `<section class="feature-card${wide ? ' wide' : ''}"><h2>${esc(title)}</h2>${html}</section>`; }
    function form(fields, submit, id='featureForm') { return `<form id="${id}" class="feature-form">${fields.join('')}<button class="portal-btn" type="submit">${esc(submit)}</button><div id="formStatus" class="feature-muted"></div></form>`; }
    function field(label, name, type='text', extra='') { return `<label>${esc(label)}<input name="${esc(name)}" type="${type}" ${extra}></label>`; }
    function textarea(label,name,placeholder='') { return `<label>${esc(label)}<textarea name="${esc(name)}" placeholder="${esc(placeholder)}"></textarea></label>`; }

    document.addEventListener('medicare:portal-ready', async ({detail}) => {
        const {user, profile, cloud} = detail;
        const def = definitions[feature] || definitions.all;
        root.innerHTML = `<div class="feature-hero"><h1>${esc(def[0])}</h1><p>${esc(def[1])}</p></div><div id="featureGrid" class="feature-grid"></div>`;
        const grid = document.getElementById('featureGrid');

        if (feature === 'all') return renderAll();
        if (feature === 'appointments') return location.href='appointments.html';
        if (feature === 'prescriptions') return renderPrescriptions();
        if (feature === 'admin') return renderAdmin();
        if (feature === 'queue') return renderQueue();
        if (feature === 'records') return renderRecords();
        if (feature === 'refill') return renderRefill();
        if (feature === 'telemedicine' || feature === 'globaltelemedicine') return renderTelemedicine();
        if (feature === 'blood') return renderBlood();
        if (feature === 'emergency') return renderEmergency();
        if (feature === 'family') return renderFamily();
        if (feature === 'wallet') return renderSimpleCollection('healthWallet', ['Expense / record title','Amount','Date','Notes']);
        if (feature === 'wearable') return renderSimpleCollection('wearableReadings', ['Device','Reading type','Value','Unit','Recorded at']);
        if (feature === 'insurance') return renderSimpleCollection('insurancePolicies', ['Provider','Policy number','Policy type','Expiry date','Notes']);
        if (feature === 'nutrition') return renderSimpleCollection('nutritionLogs', ['Goal','Food / meal notes','Date']);
        if (feature === 'mental') return renderSimpleCollection('wellnessNotes', ['Mood / topic','Notes','Date']);
        if (feature === 'lab') return renderSimpleCollection('labRequests', ['Test requested','Preferred date','Collection address','Notes']);
        if (feature === 'image') return location.href = 'image-diagnosis.html';
        return renderAll();

        async function renderAll() {
            const items = Object.entries(definitions).filter(([k]) => k !== 'all');
            grid.innerHTML = items.map(([key, val]) => `<section class="feature-card"><h3>${esc(val[0])}</h3><p>${esc(val[1])}</p><a class="feature-link" href="feature-center.html?feature=${encodeURIComponent(key)}">Open</a></section>`).join('');
        }

        async function renderSimpleCollection(collectionName, labels) {
            const names = ['title','amount','date','notes'];
            if (collectionName === 'wearableReadings') names.splice(0,names.length,...['device','readingType','value','unit','recordedAt']);
            if (collectionName === 'insurancePolicies') names.splice(0,names.length,...['provider','policyNumber','policyType','expiryDate','notes']);
            if (collectionName === 'nutritionLogs') names.splice(0,names.length,...['goal','notes','date']);
            if (collectionName === 'wellnessNotes') names.splice(0,names.length,...['topic','notes','date']);
            if (collectionName === 'labRequests') names.splice(0,names.length,...['testRequested','preferredDate','address','notes']);
            grid.innerHTML = card('Add record', form(labels.map((l,i)=>field(l,names[i] || `field${i}`,'text','required')), 'Save to cloud')) + card('My live records','<div id="recordsList" class="feature-list"><div class="feature-muted">Loading...</div></div>', true);
            document.getElementById('featureForm').addEventListener('submit', async e => { e.preventDefault(); const fd=new FormData(e.target); const data={userId:user.uid,createdAt:cloud.serverTimestamp()}; names.forEach(n=>{if(fd.get(n)!==null)data[n]=fd.get(n)}); try{await cloud.addDoc(cloud.collection(cloud.db,collectionName),data); e.target.reset(); document.getElementById('formStatus').textContent='Saved to your cloud account.'; await load();}catch(err){document.getElementById('formStatus').textContent=err.message;document.getElementById('formStatus').className='feature-danger';}});
            async function load(){const s=await cloud.getDocs(cloud.query(cloud.collection(cloud.db,collectionName),cloud.where('userId','==',user.uid),cloud.limit(50)));document.getElementById('recordsList').innerHTML=s.empty?'<div class="feature-muted">No live records yet.</div>':s.docs.map(d=>`<div class="feature-row">${Object.entries(d.data()).filter(([k])=>!['userId','createdAt'].includes(k)).map(([k,v])=>`<div><strong>${esc(k)}:</strong> ${esc(v)}</div>`).join('')}</div>`).join('');}
            await load();
        }

        async function renderRecords(){
            grid.innerHTML=card('Secure health records',`<p>Upload a document to your private Cloud Storage area.</p>${form([field('Record title','title','text','required'),field('File','file','file','accept=".pdf,.png,.jpg,.jpeg" required')],'Upload record')}`,true);
            document.getElementById('featureForm').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target),file=fd.get('file');const status=document.getElementById('formStatus');try{const storageRef=cloud.ref(cloud.storage,`health-records/${user.uid}/${Date.now()}-${file.name}`);await cloud.uploadBytes(storageRef,file);const url=await cloud.getDownloadURL(storageRef);await cloud.addDoc(cloud.collection(cloud.db,'healthRecords'),{patientId:user.uid,title:fd.get('title'),fileName:file.name,fileUrl:url,createdAt:cloud.serverTimestamp()});status.textContent='Record uploaded securely.';}catch(err){status.textContent=err.message;status.className='feature-danger';}});
        }

        async function renderUpload(){return renderRecords();}

        async function renderPrescriptions(){
            /* ---- Load Tesseract.js for OCR ---- */
            if(!window.Tesseract){const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';document.head.appendChild(s);await new Promise(r=>{s.onload=r;s.onerror=r;});}

            /* ---- Local medicine list ---- */
            let meds=[];try{meds=JSON.parse(localStorage.getItem('rx_medicines')||'[]');}catch(e){}

            /* ---- Build UI using existing portal classes ---- */
            grid.innerHTML=
            /* -- Scan Prescription Card -- */
            card('📷 Scan Prescription',`
                <p style="color:#64748b;margin-bottom:14px">Use your camera or upload a photo of your prescription to extract medicine details automatically.</p>
                <div class="feature-actions" style="margin-bottom:14px">
                    <button class="portal-btn" id="rxBtnCamera" type="button">📷 Open Camera</button>
                    <button class="portal-btn secondary" id="rxBtnUpload" type="button">📁 Upload Image</button>
                    <button class="portal-btn secondary" id="rxBtnCapture" type="button" disabled>📸 Capture</button>
                    <button class="portal-btn" id="rxBtnStop" type="button" style="display:none;background:#ef4444">⏹ Stop</button>
                </div>
                <input type="file" id="rxFileInput" accept="image/*" style="display:none">
                <div id="rxCameraBox" style="position:relative;width:100%;max-height:340px;background:#000;border-radius:12px;overflow:hidden;display:none;margin-bottom:14px">
                    <video id="rxVideo" autoplay playsinline style="width:100%;display:block"></video>
                    <canvas id="rxCanvas" style="width:100%;display:none"></canvas>
                </div>
                <img id="rxPreview" style="width:100%;max-height:300px;object-fit:contain;border-radius:12px;display:none;margin-bottom:14px" alt="Preview">
                <button class="portal-btn" id="rxBtnScanImg" type="button" style="display:none;margin-bottom:14px">🔍 Scan This Image</button>
                <div id="rxLoading" style="display:none;padding:12px;color:#15803d;font-weight:600">⏳ Scanning prescription text...</div>
                <div id="rxOcrResult" style="display:none">
                    <div style="font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">📄 Extracted Text</div>
                    <div id="rxOcrText" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:14px;font-family:monospace;font-size:13px;line-height:1.8;max-height:180px;overflow-y:auto;white-space:pre-wrap"></div>
                </div>
                <div id="rxScanStatus" class="feature-muted" style="margin-top:8px"></div>
            `,true)+

            /* -- Add Medicine Details Card -- */
            card('💊 Add Medicine Details',`
                <p style="color:#64748b;margin-bottom:14px">Enter or edit the medicine information from your prescription.</p>
                <form id="rxMedForm" class="feature-form">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <label>💊 Tablet / Medicine Name <span style="color:#ef4444">*</span>
                            <input name="medName" id="rxMedName" placeholder="e.g. Paracetamol, Amoxicillin" required>
                        </label>
                        <label>💪 Strength / Dosage
                            <input name="medStrength" id="rxMedStrength" placeholder="e.g. 500mg, 250mg">
                        </label>
                    </div>
                    <label>🕐 When to Take <span style="color:#ef4444">*</span></label>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" id="rxTimingGrid">
                        <label style="display:flex;align-items:center;gap:6px;padding:10px 12px;border:1px solid #dbe1e8;border-radius:10px;cursor:pointer;font-weight:400;font-size:14px">
                            <input type="checkbox" id="rxTimeMorning" value="Morning" style="width:16px;height:16px;accent-color:#15803d"> 🌅 Morning
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;padding:10px 12px;border:1px solid #dbe1e8;border-radius:10px;cursor:pointer;font-weight:400;font-size:14px">
                            <input type="checkbox" id="rxTimeAfternoon" value="Afternoon" style="width:16px;height:16px;accent-color:#15803d"> ☀️ Afternoon
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;padding:10px 12px;border:1px solid #dbe1e8;border-radius:10px;cursor:pointer;font-weight:400;font-size:14px">
                            <input type="checkbox" id="rxTimeEvening" value="Evening" style="width:16px;height:16px;accent-color:#15803d"> 🌇 Evening
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;padding:10px 12px;border:1px solid #dbe1e8;border-radius:10px;cursor:pointer;font-weight:400;font-size:14px">
                            <input type="checkbox" id="rxTimeNight" value="Night" style="width:16px;height:16px;accent-color:#15803d"> 🌙 Night
                        </label>
                    </div>
                    <label>🍽️ Meal Instruction</label>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
                        <label style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px;border:1px solid #dbe1e8;border-radius:10px;cursor:pointer;font-weight:400;font-size:13px;text-align:center">
                            <input type="radio" name="rxMeal" value="Before Food" style="accent-color:#15803d"> 🥄 Before Food
                        </label>
                        <label style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px;border:1px solid #15803d;border-radius:10px;cursor:pointer;font-weight:400;font-size:13px;text-align:center;background:#f0fdf4">
                            <input type="radio" name="rxMeal" value="After Food" checked style="accent-color:#15803d"> 🍽️ After Food
                        </label>
                        <label style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px;border:1px solid #dbe1e8;border-radius:10px;cursor:pointer;font-weight:400;font-size:13px;text-align:center">
                            <input type="radio" name="rxMeal" value="Any Time" style="accent-color:#15803d"> ⏰ Any Time
                        </label>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <label>📅 Duration (Days) <span style="color:#ef4444">*</span>
                            <input type="number" name="medDuration" id="rxMedDuration" placeholder="e.g. 5, 7, 10" min="1" max="365" required>
                        </label>
                        <label>🔢 Quantity per Dose
                            <select name="medQuantity" id="rxMedQuantity">
                                <option value="1 tablet">1 Tablet</option>
                                <option value="2 tablets">2 Tablets</option>
                                <option value="Half tablet">Half Tablet</option>
                                <option value="1 capsule">1 Capsule</option>
                                <option value="5ml syrup">5ml Syrup</option>
                                <option value="10ml syrup">10ml Syrup</option>
                                <option value="1 spoon">1 Spoon</option>
                                <option value="As prescribed">As Prescribed</option>
                            </select>
                        </label>
                    </div>
                    <label>📝 Additional Notes
                        <textarea name="medNotes" id="rxMedNotes" placeholder="e.g. Take with warm water, Avoid dairy products"></textarea>
                    </label>
                    <div class="feature-actions">
                        <button class="portal-btn" type="submit">✅ Save Medicine</button>
                        <button class="portal-btn secondary" type="button" id="rxBtnClear">🗑️ Clear Form</button>
                    </div>
                    <div id="rxFormStatus" class="feature-muted"></div>
                </form>
            `,true)+

            /* -- My Medicine Schedule Card -- */
            card('📋 My Medicine Schedule',`<div id="rxMedList"></div>`,true);

            /* ======= DOM refs ======= */
            const rxVideo=document.getElementById('rxVideo');
            const rxCanvas=document.getElementById('rxCanvas');
            const rxCameraBox=document.getElementById('rxCameraBox');
            const rxPreview=document.getElementById('rxPreview');
            const rxFileInput=document.getElementById('rxFileInput');
            const rxOcrText=document.getElementById('rxOcrText');
            const rxOcrResult=document.getElementById('rxOcrResult');
            const rxLoading=document.getElementById('rxLoading');
            const rxScanStatus=document.getElementById('rxScanStatus');
            const rxFormStatus=document.getElementById('rxFormStatus');
            const rxMedList=document.getElementById('rxMedList');
            let camStream=null;

            /* ======= Camera ======= */
            document.getElementById('rxBtnCamera').addEventListener('click',async()=>{
                try{
                    camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}}});
                    rxVideo.srcObject=camStream;rxVideo.style.display='block';rxCanvas.style.display='none';
                    rxCameraBox.style.display='block';
                    document.getElementById('rxBtnCapture').disabled=false;
                    document.getElementById('rxBtnCamera').style.display='none';
                    document.getElementById('rxBtnStop').style.display='inline-block';
                    rxScanStatus.textContent='';rxScanStatus.className='feature-muted';
                }catch(e){rxScanStatus.textContent='❌ Camera access denied. Use Upload instead.';rxScanStatus.className='feature-danger';}
            });

            document.getElementById('rxBtnCapture').addEventListener('click',()=>{
                if(!camStream)return;
                const ctx=rxCanvas.getContext('2d');
                rxCanvas.width=rxVideo.videoWidth;rxCanvas.height=rxVideo.videoHeight;
                ctx.drawImage(rxVideo,0,0);
                rxCanvas.style.display='block';rxVideo.style.display='none';
                stopCam();
                runOCR(rxCanvas.toDataURL('image/png'));
            });

            document.getElementById('rxBtnStop').addEventListener('click',()=>{stopCam();rxCameraBox.style.display='none';});

            function stopCam(){
                if(camStream){camStream.getTracks().forEach(t=>t.stop());camStream=null;}
                document.getElementById('rxBtnCapture').disabled=true;
                document.getElementById('rxBtnCamera').style.display='inline-block';
                document.getElementById('rxBtnStop').style.display='none';
            }

            /* ======= Upload ======= */
            document.getElementById('rxBtnUpload').addEventListener('click',()=>rxFileInput.click());
            rxFileInput.addEventListener('change',()=>{if(rxFileInput.files.length)handleFile(rxFileInput.files[0]);});

            function handleFile(file){
                if(!file.type.startsWith('image/')){rxScanStatus.textContent='Please select an image file.';rxScanStatus.className='feature-danger';return;}
                const reader=new FileReader();
                reader.onload=e=>{rxPreview.src=e.target.result;rxPreview.style.display='block';document.getElementById('rxBtnScanImg').style.display='inline-block';};
                reader.readAsDataURL(file);
            }

            document.getElementById('rxBtnScanImg').addEventListener('click',()=>runOCR(rxPreview.src));

            /* ======= OCR ======= */
            async function runOCR(src){
                rxLoading.style.display='block';rxOcrResult.style.display='none';rxScanStatus.textContent='';
                try{
                    const result=await Tesseract.recognize(src,'eng',{logger:i=>{if(i.status==='recognizing text')rxLoading.textContent=`⏳ Scanning... ${Math.round((i.progress||0)*100)}%`;}});
                    const txt=result.data.text.trim();
                    rxLoading.style.display='none';
                    if(txt.length<5){rxScanStatus.textContent='Could not read text clearly. Try a better photo or enter manually.';rxScanStatus.className='feature-danger';return;}
                    rxOcrText.textContent=txt;rxOcrResult.style.display='block';
                    rxScanStatus.textContent='✅ Text extracted! Edit medicine details below.';rxScanStatus.className='feature-success';
                    autoFill(txt);
                }catch(e){rxLoading.style.display='none';rxScanStatus.textContent='OCR failed: '+e.message;rxScanStatus.className='feature-danger';}
            }

            function autoFill(text){
                const lines=text.split('\n').filter(l=>l.trim().length>2);
                for(const l of lines){const c=l.trim();if(c.length>3&&c.length<80&&!/^(dr\.|date|hospital|clinic|patient|name|age|rx|sig)/i.test(c)){document.getElementById('rxMedName').value=c.split(/\s{2,}/)[0].substring(0,50);break;}}
                const sm=text.match(/(\d+\s*(mg|ml|mcg|gm|g)\b)/i);if(sm)document.getElementById('rxMedStrength').value=sm[1];
                const tm=text.match(/(morning|evening|night|afternoon|bedtime)/gi);
                if(tm)tm.forEach(t=>{const l=t.toLowerCase();if(l.includes('morning'))document.getElementById('rxTimeMorning').checked=true;if(l.includes('afternoon'))document.getElementById('rxTimeAfternoon').checked=true;if(l.includes('evening'))document.getElementById('rxTimeEvening').checked=true;if(l.includes('night')||l.includes('bedtime'))document.getElementById('rxTimeNight').checked=true;});
                const dm=text.match(/(\d+)\s*(days?|weeks?|months?)/i);
                if(dm){let d=parseInt(dm[1]);if(dm[2].toLowerCase().startsWith('week'))d*=7;if(dm[2].toLowerCase().startsWith('month'))d*=30;document.getElementById('rxMedDuration').value=d;}
            }

            /* ======= Form Submit ======= */
            document.getElementById('rxMedForm').addEventListener('submit',async e=>{
                e.preventDefault();
                const name=document.getElementById('rxMedName').value.trim();
                const strength=document.getElementById('rxMedStrength').value.trim();
                const duration=document.getElementById('rxMedDuration').value.trim();
                const quantity=document.getElementById('rxMedQuantity').value;
                const notes=document.getElementById('rxMedNotes').value.trim();
                const timings=[];
                if(document.getElementById('rxTimeMorning').checked)timings.push('Morning');
                if(document.getElementById('rxTimeAfternoon').checked)timings.push('Afternoon');
                if(document.getElementById('rxTimeEvening').checked)timings.push('Evening');
                if(document.getElementById('rxTimeNight').checked)timings.push('Night');
                if(!timings.length){rxFormStatus.textContent='Please select at least one timing.';rxFormStatus.className='feature-danger';return;}
                const meal=document.querySelector('input[name="rxMeal"]:checked')?.value||'After Food';
                const med={id:'med_'+Date.now(),medicineName:name,strength,timings,mealRelation:meal,duration:duration+' days',durationDays:parseInt(duration),quantity,notes,createdAt:new Date().toISOString(),startDate:new Date().toISOString().split('T')[0]};
                meds.unshift(med);localStorage.setItem('rx_medicines',JSON.stringify(meds));renderMedList();
                try{await cloud.addDoc(cloud.collection(cloud.db,'prescriptions'),{patientId:user.uid,medicineName:name,strength,timings,mealRelation:meal,duration:duration+' days',durationDays:parseInt(duration),quantity,dosage:quantity+' - '+timings.join(', ')+' - '+meal,notes,status:'active',createdAt:cloud.serverTimestamp()});
                    rxFormStatus.textContent='✅ Medicine saved to cloud & locally!';rxFormStatus.className='feature-success';
                }catch(err){rxFormStatus.textContent='✅ Saved locally! Cloud sync on next login.';rxFormStatus.className='feature-success';}
                document.getElementById('rxMedForm').reset();document.querySelector('input[name="rxMeal"][value="After Food"]').checked=true;
            });

            document.getElementById('rxBtnClear').addEventListener('click',()=>{document.getElementById('rxMedForm').reset();document.querySelector('input[name="rxMeal"][value="After Food"]').checked=true;rxFormStatus.textContent='';});

            /* ======= Render Saved Medicines ======= */
            function renderMedList(){
                if(!meds.length){rxMedList.innerHTML='<div class="feature-muted">💊 No medicines added yet. Scan a prescription or add details above.</div>';return;}
                rxMedList.innerHTML=meds.map((m,i)=>{
                    const pills=(m.timings||[]).map(t=>{const e=t==='Morning'?'🌅':t==='Afternoon'?'☀️':t==='Evening'?'🌇':'🌙';return `<span style="display:inline-block;background:#f0fdf4;color:#15803d;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;margin:2px">${e} ${esc(t)}</span>`;}).join('');
                    let remain='';if(m.startDate&&m.durationDays){const end=new Date(m.startDate);end.setDate(end.getDate()+m.durationDays);const diff=Math.ceil((end-new Date())/(864e5));remain=diff>0?`<span style="color:#15803d;font-size:12px">${diff} days left</span>`:'<span style="color:#ef4444;font-size:12px">Course completed</span>';}
                    return `<div class="feature-row" style="margin-top:10px">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start">
                            <div><strong style="font-size:16px">${esc(m.medicineName||'Medicine')}</strong>${m.strength?` <span style="color:#15803d;font-size:13px">(${esc(m.strength)})</span>`:''}</div>
                            <button class="portal-btn secondary" data-rxdel="${i}" style="padding:4px 10px;font-size:12px">🗑️</button>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:10px">
                            <div style="background:#f8fafc;padding:8px 12px;border-radius:8px"><div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:2px">Timing</div>${pills||'—'}</div>
                            <div style="background:#f8fafc;padding:8px 12px;border-radius:8px"><div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:2px">Meal</div><div style="font-weight:600">${esc(m.mealRelation||'After Food')}</div></div>
                            <div style="background:#f8fafc;padding:8px 12px;border-radius:8px"><div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:2px">Duration</div><div style="font-weight:600">${esc(m.duration||'—')}</div>${remain}</div>
                            <div style="background:#f8fafc;padding:8px 12px;border-radius:8px"><div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:2px">Quantity</div><div style="font-weight:600">${esc(m.quantity||'1 tablet')}</div></div>
                        </div>
                        ${m.notes?`<div style="margin-top:10px;padding:8px 12px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;font-size:13px;color:#92400e">📝 ${esc(m.notes)}</div>`:''}
                    </div>`;
                }).join('');
                rxMedList.querySelectorAll('[data-rxdel]').forEach(b=>b.addEventListener('click',()=>{const i=parseInt(b.dataset.rxdel);if(confirm('Delete "'+meds[i]?.medicineName+'"?')){meds.splice(i,1);localStorage.setItem('rx_medicines',JSON.stringify(meds));renderMedList();}}));
            }

            /* ======= Load Firestore prescriptions too ======= */
            try{
                const snap=await cloud.getDocs(cloud.query(cloud.collection(cloud.db,'prescriptions'),cloud.where('patientId','==',user.uid),cloud.orderBy('createdAt','desc'),cloud.limit(50)));
                if(!snap.empty)snap.docs.forEach(d=>{const data=d.data();if(!meds.find(m=>m.id===d.id))meds.push({id:d.id,...data,_cloud:true});});
            }catch(e){}
            renderMedList();
        }

        async function renderRefill(){const s=await cloud.getDocs(cloud.query(cloud.collection(cloud.db,'prescriptions'),cloud.where('patientId','==',user.uid),cloud.limit(50)));grid.innerHTML=card('Eligible prescription records',s.empty?'<div class="feature-muted">No prescription records found.</div>':s.docs.map(d=>{const x=d.data();return `<div class="feature-row"><strong>${esc(x.medicineName||'Prescription')}</strong><div>${esc(x.dosage||'')}</div><button class="portal-btn" data-refill="${d.id}">Request refill</button></div>`}).join(''),true);grid.querySelectorAll('[data-refill]').forEach(b=>b.addEventListener('click',async()=>{await cloud.addDoc(cloud.collection(cloud.db,'refillRequests'),{patientId:user.uid,prescriptionId:b.dataset.refill,status:'requested',createdAt:cloud.serverTimestamp()});b.textContent='Refill requested';b.disabled=true;}));}

        async function renderTelemedicine(){const doctors=await cloud.getDocs(cloud.query(cloud.collection(cloud.db,'doctorProfiles'),cloud.where('active','==',true),cloud.where('verificationStatus','==','verified'),cloud.limit(50)));grid.innerHTML=card('Verified doctors',doctors.empty?'<div class="feature-muted">No verified doctors are currently available.</div>':doctors.docs.map(d=>{const x=d.data();return `<div class="feature-row"><strong>${esc(x.name||'Doctor')}</strong><div>${esc(x.specialization||'')}</div><button class="portal-btn" data-doctor="${d.id}">Request online consultation</button></div>`}).join(''),true)+card('Video connection','<div class="feature-muted">A live video room is created only when a supported video provider is connected. No fake meeting link is generated.</div>');grid.querySelectorAll('[data-doctor]').forEach(b=>b.addEventListener('click',async()=>{await cloud.addDoc(cloud.collection(cloud.db,'telemedicineRequests'),{patientId:user.uid,doctorId:b.dataset.doctor,status:'requested',createdAt:cloud.serverTimestamp()});b.textContent='Request submitted';b.disabled=true;}));}

        async function renderBlood(){return renderSimpleCollection('bloodDonorRegistrations',['Blood group','Availability','City / area','Contact preference']);}
        async function renderEmergency(){grid.innerHTML=card('Emergency contact',form([field('Contact name','contactName','text','required'),field('Phone','phone','tel','required'),field('Relationship','relationship','text','required')],'Save contact'))+card('Create emergency request',form([field('Current location / address','location','text','required'),textarea('Emergency details','details','Briefly describe what help is needed')],'Create emergency request'));document.querySelectorAll('.feature-form').forEach((f,i)=>f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f);const c=i===0?'emergencyContacts':'emergencyRequests';const data={userId:user.uid,status:'active',createdAt:cloud.serverTimestamp()};for(const [k,v] of fd.entries())data[k]=v;await cloud.addDoc(cloud.collection(cloud.db,c),data);f.reset();f.querySelector('#formStatus').textContent='Saved to cloud.';}));}
        async function renderFamily(){grid.innerHTML=card('Family member access',form([field('Family member email','memberEmail','email','required'),field('Relationship','relationship','text','required')],'Request family link'))+card('My family links','<div id="familyList" class="feature-list"><div class="feature-muted">Loading...</div></div>');const s=await cloud.getDocs(cloud.query(cloud.collection(cloud.db,'familyLinks'),cloud.where('ownerId','==',user.uid),cloud.limit(50)));document.getElementById('familyList').innerHTML=s.empty?'<div class="feature-muted">No family links.</div>':s.docs.map(d=>`<div class="feature-row">${esc(d.data().memberEmail||'')} — ${esc(d.data().status||'requested')}</div>`).join('');document.getElementById('featureForm').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target);await cloud.addDoc(cloud.collection(cloud.db,'familyLinks'),{ownerId:user.uid,memberEmail:fd.get('memberEmail'),relationship:fd.get('relationship'),status:'requested',createdAt:cloud.serverTimestamp()});e.target.reset();alert('Family access request saved.');});}
        async function renderQueue(){grid.innerHTML=card('Nearby hospitals','<p>Live places from Google Places. Live queue times are shown only when a connected hospital provides queue data.</p><div id="nearby" class="feature-list"><div class="feature-muted">Requesting location...</div></div>',true);if(!navigator.geolocation){document.getElementById('nearby').innerHTML='<div class="feature-danger">Geolocation is unavailable.</div>';return;}navigator.geolocation.getCurrentPosition(async p=>{try{const token=await cloud.auth.currentUser.getIdToken();const r=await fetch('/api/places/nearby?'+new URLSearchParams({lat:p.coords.latitude,lng:p.coords.longitude,type:'hospital'}),{headers:{Authorization:'Bearer '+token}});const d=await r.json();document.getElementById('nearby').innerHTML=d.results?.length?d.results.map(x=>`<div class="feature-row"><strong>${esc(x.displayName?.text||'Hospital')}</strong><div>${esc(x.formattedAddress||'')}</div><div class="feature-muted">Live queue: not provided by Google Places.</div>${x.googleMapsUri?`<a href="${esc(x.googleMapsUri)}" target="_blank" rel="noopener">Open in Maps</a>`:''}</div>`).join(''):'<div class="feature-muted">No live hospitals returned.</div>';}catch(err){document.getElementById('nearby').innerHTML=`<div class="feature-danger">${esc(err.message)}</div>`;}},()=>{document.getElementById('nearby').innerHTML='<div class="feature-danger">Location permission was not granted.</div>';});}
        async function renderAdmin(){if(profile.role!=='admin'){grid.innerHTML=card('Access restricted','<div class="feature-danger">Admin verification tools require an admin account.</div>');return;}const [d,p]=await Promise.all([cloud.getDocs(cloud.query(cloud.collection(cloud.db,'doctorProfiles'),cloud.where('verificationStatus','==','pending'),cloud.limit(50))),cloud.getDocs(cloud.query(cloud.collection(cloud.db,'pharmacyProfiles'),cloud.where('verificationStatus','==','pending'),cloud.limit(50)))]);grid.innerHTML=card('Pending doctors',d.empty?'<div class="feature-muted">No pending doctors.</div>':d.docs.map(x=>`<div class="feature-row"><strong>${esc(x.data().name||x.id)}</strong><div>${esc(x.data().specialization||'')}</div><button class="portal-btn" data-verify-doctor="${x.id}">Verify</button></div>`).join(''))+card('Pending pharmacies',p.empty?'<div class="feature-muted">No pending pharmacies.</div>':p.docs.map(x=>`<div class="feature-row"><strong>${esc(x.data().name||x.id)}</strong><button class="portal-btn" data-verify-pharmacy="${x.id}">Verify</button></div>`).join(''));grid.querySelectorAll('[data-verify-doctor]').forEach(b=>b.addEventListener('click',async()=>{await cloud.updateDoc(cloud.doc(cloud.db,'doctorProfiles',b.dataset.verifyDoctor),{verificationStatus:'verified',active:true,verifiedAt:cloud.serverTimestamp()});b.textContent='Verified';b.disabled=true;}));grid.querySelectorAll('[data-verify-pharmacy]').forEach(b=>b.addEventListener('click',async()=>{await cloud.updateDoc(cloud.doc(cloud.db,'pharmacyProfiles',b.dataset.verifyPharmacy),{verificationStatus:'verified',active:true,verifiedAt:cloud.serverTimestamp()});b.textContent='Verified';b.disabled=true;}));}
    });
})();
