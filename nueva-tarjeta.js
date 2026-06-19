 // nueva-tarjeta.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Protegemos la pantalla: si no hay sesión, al login
let usuarioActual = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        usuarioActual = user;
    }
});

// --- Preview del nombre en tiempo real ---
const inputNombre = document.querySelector('input[type="text"]');
const previewNombre = document.getElementById('preview-nombre');

inputNombre.addEventListener('input', function() {
    previewNombre.textContent = this.value || 'Nombre de la tarjeta';
});

// --- Selector de color ---
const colorOpts = document.querySelectorAll('.color-opt');
const previewColor = document.getElementById('preview-color');
let colorSeleccionado = '#534AB7'; // violeta por defecto

colorOpts.forEach(btn => {
    btn.addEventListener('click', function() {
        colorOpts.forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        colorSeleccionado = this.dataset.color;
        previewColor.style.background = colorSeleccionado;
    });
});

// --- Guardar tarjeta ---
const btnGuardar = document.querySelector('.btn-guardar');
const inputCierre = document.getElementById('input-cierre');

btnGuardar.addEventListener('click', async () => {
    const nombre = inputNombre.value.trim();
    const diaCierre = inputCierre.value;

    if (!nombre) {
        alert('Por favor ingresá el nombre de la tarjeta');
        return;
    }

    if (!diaCierre || diaCierre < 1 || diaCierre > 31) {
        alert('Por favor ingresá un día de cierre válido (1-31)');
        return;
    }

    if (!usuarioActual) {
        alert('Tenés que iniciar sesión para guardar una tarjeta');
        return;
    }

    try {
        // Guardamos la tarjeta en la colección "tarjetas" de Firestore
        await addDoc(collection(db, 'tarjetas'), {
            nombre: nombre,
            color: colorSeleccionado,
            diaCierre: Number(diaCierre),
            userId: usuarioActual.uid
        });

        window.location.href = 'tarjetas.html';
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al guardar la tarjeta. Intentá de nuevo.');
    }
});