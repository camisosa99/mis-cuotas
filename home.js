// home.js

import { auth } from './firebase.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Si no hay sesión activa, mandamos al login
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    }
});

// --- CERRAR SESIÓN ---
const btnLogout = document.getElementById('btn-logout');

btnLogout.addEventListener('click', async () => {
    const confirmar = confirm('¿Querés cerrar sesión?');
    if (confirmar) {
        await signOut(auth);
        window.location.href = 'index.html';
    }
});