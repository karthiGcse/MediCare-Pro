# Google Cloud setup for MediCare Pro

## 1. Firebase project

Create/select the Google Cloud project in the Firebase console and add a Web App.

Enable:
- Authentication: Email/Password and Google provider
- Firestore Database
- Cloud Storage
- Firebase Hosting
- Cloud Functions

## 2. Frontend configuration

Copy the Firebase Web App configuration into:

`frontend/js/firebase-config.js`

Only the public Firebase Web App configuration belongs there. Do not paste a service-account private key.

## 3. Firebase project selection

Copy `.firebaserc.example` to `.firebaserc` and replace `YOUR_FIREBASE_PROJECT_ID`.

## 4. Infermedica secret

The symptom service uses server-side secrets. Run from the project root:

`firebase functions:secrets:set INFERMEDICA_APP_ID`

`firebase functions:secrets:set INFERMEDICA_APP_KEY`

For nearby Google Places data:

`firebase functions:secrets:set GOOGLE_MAPS_API_KEY`

The values are not stored in frontend JavaScript.

## 5. Deploy

Install Firebase CLI if necessary, then:

`firebase login`

`firebase use YOUR_FIREBASE_PROJECT_ID`

`firebase deploy`

## 6. Real data only

Do not manually insert fake doctors, pharmacies, appointments or medicine records. Doctor and pharmacy profiles become visible only after their real accounts are verified. The application displays an empty state when no real record/API result exists.
