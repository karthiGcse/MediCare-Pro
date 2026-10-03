@echo off
setlocal

echo MediCare Google Cloud deployment helper

echo.
echo 1. Configure frontend\js\firebase-config.js with your Firebase Web App values.
echo 2. Copy .firebaserc.example to .firebaserc and set your Firebase project ID.
echo 3. Run: firebase login
 echo 4. Run: firebase use YOUR_PROJECT_ID
 echo 5. Run: firebase functions:secrets:set INFERMEDICA_APP_ID
 echo 6. Run: firebase functions:secrets:set INFERMEDICA_APP_KEY
 echo 7. Run: firebase deploy
 echo.
echo No MongoDB is required.
pause
