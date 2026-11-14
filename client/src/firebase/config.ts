import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyAJhzA-tgGXQAP5_kwxXtah_ZCZ-E09Epw",
    authDomain: "movierecomender-5a4e2.firebaseapp.com",
    projectId: "movierecomender-5a4e2",
    storageBucket: "movierecomender-5a4e2.firebasestorage.app",
    messagingSenderId: "970307273430",
    appId: "1:970307273430:web:df491a5d65406fce0b3f77",
    measurementId: "G-ZHSNTWGQGL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const analytics = getAnalytics(app);

export default app;
