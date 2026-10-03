const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const INFERMEDICA_APP_ID = defineSecret("INFERMEDICA_APP_ID");
const INFERMEDICA_APP_KEY = defineSecret("INFERMEDICA_APP_KEY");
const GOOGLE_MAPS_API_KEY = defineSecret("GOOGLE_MAPS_API_KEY");
const INFERMEDICA_BASE_URL = "https://api.infermedica.com/v3";

function json(res, status, body) {
    return res.status(status).json(body);
}

async function verifyUser(req) {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) return null;

    try {
        return await admin.auth().verifyIdToken(authorization.slice(7));
    } catch {
        return null;
    }
}

function normalizeEvidence(rawEvidence) {
    if (!Array.isArray(rawEvidence)) return [];

    const seen = new Set();
    const evidence = [];

    for (const item of rawEvidence) {
        if (!item || typeof item !== "object") continue;
        const id = item.id;
        const choiceId = item.choice_id || item.choiceId;
        if (!id || !choiceId) continue;

        const key = `${id}:${choiceId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        evidence.push({
            id,
            choice_id: choiceId,
            source: item.source || "initial"
        });
    }

    return evidence;
}

async function infermedicaRequest(endpoint, payload, interviewId) {
    const appId = INFERMEDICA_APP_ID.value();
    const appKey = INFERMEDICA_APP_KEY.value();

    if (!appId || !appKey) {
        const error = new Error("Infermedica is not configured in Google Secret Manager.");
        error.status = 503;
        throw error;
    }

    const headers = {
        "Content-Type": "application/json",
        "App-Id": appId,
        "App-Key": appKey
    };

    if (interviewId) headers["Interview-Id"] = interviewId;

    const response = await fetch(`${INFERMEDICA_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        const error = new Error(data.message || data.error || `Infermedica request failed (${response.status}).`);
        error.status = response.status;
        throw error;
    }

    return data;
}

async function parseSymptoms(text, age, sex) {
    if (!text.trim()) return [];

    const response = await infermedicaRequest("/parse", {
        text: text.trim(),
        age,
        sex
    });

    const mentions = response.mentions || response.observations || response.evidence || [];
    const evidence = [];

    for (const mention of mentions) {
        const id = mention.id || mention.name_id || mention.observation_id;
        if (!id) continue;

        evidence.push({
            id,
            choice_id: mention.choice_id || mention.choiceId || "present",
            source: "initial"
        });
    }

    return normalizeEvidence(evidence);
}

exports.api = onRequest(
    {
        region: "asia-south1",
        cors: true,
        secrets: [INFERMEDICA_APP_ID, INFERMEDICA_APP_KEY, GOOGLE_MAPS_API_KEY]
    },
    async (req, res) => {
        const user = await verifyUser(req);
        if (!user) {
            return json(res, 401, { message: "Please sign in before using this service." });
        }

        if (req.method === "GET" && req.path === "/medicine/search") {
            const term = String(req.query.q || "").trim();
            if (term.length < 2) return json(res, 400, { message: "Enter at least 2 characters." });

            const response = await fetch(`https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(term)}`);
            if (!response.ok) return json(res, 502, { message: "The live medicine database is unavailable." });
            const data = await response.json();
            const groups = data.drugGroup?.conceptGroup || [];
            const results = groups.flatMap(group => group.conceptProperties || []).slice(0, 30).map(item => ({
                rxcui: item.rxcui,
                name: item.name,
                synonym: item.synonym || ""
            }));
            return json(res, 200, { results });
        }

        if (req.method === "GET" && req.path === "/medicine/interactions") {
            const rxcuis = String(req.query.rxcuis || "").split(",").map(v => v.trim()).filter(Boolean);
            if (rxcuis.length < 2) return json(res, 400, { message: "Provide at least two RxCUI values." });
            const response = await fetch(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${encodeURIComponent(rxcuis.join("+"))}`);
            if (!response.ok) return json(res, 502, { message: "The live interaction database is unavailable." });
            const data = await response.json();
            const groups = data.fullInteractionTypeGroup || [];
            const interactions = groups.flatMap(group => group.fullInteractionType || []).flatMap(type => type.fullInteraction || []).map(item => ({
                description: item.description || "",
                severity: item.severity || "",
                minConcept: item.minConcept || null,
                interactionPair: item.interactionPair || []
            }));
            return json(res, 200, { interactions });
        }

        if (req.method === "GET" && req.path === "/places/nearby") {
            const lat = Number(req.query.lat);
            const lng = Number(req.query.lng);
            const type = String(req.query.type || "hospital");
            const allowedTypes = new Set(["hospital", "pharmacy", "medical_lab"]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng) || !allowedTypes.has(type)) {
                return json(res, 400, { message: "Valid location and service type are required." });
            }

            const key = GOOGLE_MAPS_API_KEY.value();
            if (!key) return json(res, 503, { message: "Google Places is not configured in Secret Manager." });

            const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": key,
                    "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.businessStatus"
                },
                body: JSON.stringify({
                    includedTypes: [type],
                    maxResultCount: 20,
                    locationRestriction: {
                        circle: {
                            center: { latitude: lat, longitude: lng },
                            radius: 5000
                        }
                    }
                })
            });

            if (!response.ok) return json(res, 502, { message: "Google Places is unavailable." });
            const data = await response.json();
            return json(res, 200, { results: data.places || [] });
        }

        if (req.method !== "POST" || req.path !== "/symptoms/analyze") {
            return json(res, 404, { message: "API endpoint not found." });
        }

        try {
            const body = req.body || {};
            const age = Number(body.age);
            const sex = String(body.sex || "").toLowerCase();
            const text = typeof body.text === "string" ? body.text : "";
            const interviewId = body.interviewId || body.interview_id || null;
            let evidence = normalizeEvidence(body.evidence || []);

            if (!Number.isFinite(age) || age < 1 || age > 120) {
                return json(res, 400, { message: "Please enter a valid age between 1 and 120." });
            }

            if (!["male", "female"].includes(sex)) {
                return json(res, 400, { message: "Please select a valid biological sex." });
            }

            if (!evidence.length && !text.trim()) {
                return json(res, 400, { message: "Please add at least one symptom before analysis." });
            }

            if (text.trim()) {
                evidence = normalizeEvidence([...evidence, ...(await parseSymptoms(text, age, sex))]);
            }

            if (!evidence.length) {
                return json(res, 400, { message: "No valid symptoms were found for analysis." });
            }

            const result = await infermedicaRequest("/diagnosis", {
                sex,
                age,
                evidence
            }, interviewId);

            await db.collection("symptomAssessments").add({
                patientId: user.uid,
                age,
                sex,
                evidence,
                interviewId: result.interview_id || interviewId || null,
                conditions: Array.isArray(result.conditions) ? result.conditions : [],
                hasEmergencyEvidence: Boolean(result.has_emergency_evidence),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return json(res, 200, {
                interview_id: result.interview_id || interviewId || null,
                question: result.question || null,
                conditions: Array.isArray(result.conditions) ? result.conditions : [],
                should_stop: Boolean(result.should_stop),
                has_emergency_evidence: Boolean(result.has_emergency_evidence),
                extras: result.extras || {},
                recommendations: result.recommendations || [],
                message: result.message || null
            });
        } catch (error) {
            console.error("Symptom analysis error:", error);
            return json(res, error.status || 500, {
                message: error.message || "Unable to analyze symptoms right now."
            });
        }
    }
);
