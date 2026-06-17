// firebase.js
// Conexión central con Firebase — todos los demás JS lo van a usar

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Credenciales de tu proyecto en Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAjmjbUQjx3_0h3PzN4gkU4ZonV_0yHP9A",
    authDomain: "mis-cuotas-87bed.firebaseapp.com",
    projectId: "mis-cuotas-87bed",
    storageBucket: "mis-cuotas-87bed.firebasestorage.app",
    messagingSenderId: "899287231600",
    appId: "1:899287231600:web:868292187af88c252b18b5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar auth y db para usarlos en los demás archivos
export const auth = getAuth(app);
export const db = getFirestore(app);