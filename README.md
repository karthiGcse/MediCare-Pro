# MediCare Pro — Google Cloud continuation

This package continues the existing MediCare UI/UX without replacing the dashboard design. MongoDB is not used.

## Cloud stack
- Firebase Authentication
- Cloud Firestore
- Cloud Storage
- Firebase Hosting
- Firebase Cloud Functions (Node.js 22)
- Google Places API through the secure function
- Infermedica through the secure function when credentials are configured
- RxNorm/RxNav live medicine terminology and interaction data

## Main live workflows
- Patient, doctor and pharmacist registration
- Doctor/pharmacy verification by admin
- Patient appointment requests
- Doctor appointment approval
- Doctor prescription creation
- Patient prescription records
- Patient order request to verified pharmacy
- Pharmacy inventory and order fulfilment
- Health-record file upload to Cloud Storage
- Symptom assessment through the connected Infermedica API
- Live medicine lookup and drug interaction lookup
- Nearby hospital/pharmacy/lab lookup through Google Places
- Emergency contacts and emergency requests
- Family access requests
- Home lab requests
- Blood donor registration
- Insurance records
- Nutrition and wellness records
- Wearable reading records
- Health wallet records
- Medicine refill requests
- Telemedicine requests (a real video provider must be connected before a video room is created)
- Hospital queue page uses real Google Places locations; live queue values are not fabricated

## Important
No fake doctor, hospital, pharmacy, medicine, appointment or live queue records are seeded by the application.
Provider-dependent features show an unavailable/empty state until the real provider is connected.

## Configure
1. Create a Firebase project in Google Cloud/Firebase.
2. Enable Email/Password and Google Authentication.
3. Create Firestore and Cloud Storage.
4. Put the Firebase Web App configuration in `frontend/js/firebase-config.js`.
5. Deploy Firestore and Storage rules.
6. Deploy Cloud Functions.
7. Store `INFERMEDICA_APP_ID`, `INFERMEDICA_APP_KEY` and `GOOGLE_MAPS_API_KEY` as Firebase/Google Cloud secrets.
8. Deploy Hosting.

See `GOOGLE_CLOUD_SETUP.md` for commands and deployment notes.
