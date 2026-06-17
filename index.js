// index.js

import { auth } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- TABS login / registro ---
const tabs = document.querySelectorAll('.tab');
const panelLogin = document.getElementById('panel-login');
const panelRegister = document.getElementById('panel-register');

tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (i === 0) {
            panelLogin.classList.add('active');
            panelRegister.classList.remove('active');
        } else {
            panelRegister.classList.add('active');
            panelLogin.classList.remove('active');
        }
    });
});

// Si el usuario ya tiene sesión iniciada, lo mandamos directo al home
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'home.html';
    }
});

// --- REGISTRO ---
const btnCrearCuenta = document.querySelector('#panel-register .btn-primary');

btnCrearCuenta.addEventListener('click', async () => {
    const nombre = document.querySelector('#panel-register input[type="text"]').value.trim();
    const email = document.querySelector('#panel-register input[type="email"]').value.trim();
    const password = document.querySelector('#panel-register input[type="password"]').value;

    if (!nombre || !email || !password) {
        alert('Por favor completá todos los campos');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = 'home.html';
    } catch (error) {
        mostrarError(error.code);
    }
});

// --- LOGIN ---
const btnIngresar = document.querySelector('#panel-login .btn-primary');

btnIngresar.addEventListener('click', async () => {
    const email = document.querySelector('#panel-login input[type="email"]').value.trim();
    const password = document.querySelector('#panel-login input[type="password"]').value;

    if (!email || !password) {
        alert('Por favor completá todos los campos');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'home.html';
    } catch (error) {
        mostrarError(error.code);
    }
});

// --- LOGIN CON GOOGLE ---
const btnsGoogle = document.querySelectorAll('.btn-google');
const provider = new GoogleAuthProvider();

btnsGoogle.forEach(btn => {
    btn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, provider);
            window.location.href = 'home.html';
        } catch (error) {
            mostrarError(error.code);
        }
    });
});

// --- Mensajes de error en español ---
function mostrarError(code) {
    const errores = {
        'auth/email-already-in-use': 'Ese email ya está registrado.',
        'auth/invalid-email': 'El email no es válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'La contraseña es incorrecta.',
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.'
    };
    alert(errores[code] || 'Ocurrió un error. Intentá de nuevo.');
}