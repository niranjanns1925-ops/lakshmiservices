# Lakshmi E-Sevai Maiyam

A fully functional, production-ready web application for an Indian E-Sevai Center. Built with React, Tailwind CSS, and Firebase.

## Technology Stack
- **Frontend:** React + Vite + Tailwind CSS + Lucide React
- **Backend/Database:** Firebase (Auth, Firestore, Storage)
- **Forms & Validation:** React Hook Form + Zod
- **Routing:** React Router DOM

## Environment Variables
Create a `.env` file in the root directory and add your Firebase credentials:
```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

## Running Locally
1. `npm install`
2. `npm run dev`

## Deployment (Vercel)
This project is configured and ready to be deployed on Vercel.
1. Push this repository to GitHub.
2. Go to Vercel and import the project.
3. Make sure the Framework Preset is set to `Vite`.
4. Add the Firebase variables defined in your `.env` to the Environment Variables section in Vercel settings.
5. Deploy.

## Firebase Setup
1. Create a Firebase Project.
2. Enable Authentication (Email/Password).
3. Enable Firestore Database and Storage.
4. Go to Firestore Rules and paste the contents in `firestore.rules`.
5. Note: By default, users register as `user`. To create an Admin, either change the `role` field directly in the Firestore database to `admin`, or adjust the registration logic temporarily.
