import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2HjF3Bkn0q-fS76CfuOkVll6-tGlFX0g",
  authDomain: "horario-sdesk.firebaseapp.com",
  projectId: "horario-sdesk",
  storageBucket: "horario-sdesk.firebasestorage.app",
  messagingSenderId: "408148478727",
  appId: "1:408148478727:web:146e0f82a2fe83d01093a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };