// tarjetas.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const tarjetasList = document.getElementById('tarjetas-list');

// Protegemos la pantalla y cargamos las tarjetas del usuario que inició sesión
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    await cargarTarjetas(user.uid);
});

async function cargarTarjetas(userId) {
    try {
        // Buscamos en la colección "tarjetas" solo las que tienen userId == el usuario actual
        const q = query(collection(db, 'tarjetas'), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tarjetasList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:13px; padding:20px;">Todavía no agregaste ninguna tarjeta</p>';
            return;
        }

        tarjetasList.innerHTML = ''; // limpiamos antes de generar

        snapshot.forEach((doc) => {
            const tarjeta = doc.data();
            const item = crearTarjetaHTML(tarjeta);
            tarjetasList.appendChild(item);
        });

    } catch (error) {
        console.error(error);
        tarjetasList.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:13px;">Ocurrió un error al cargar tus tarjetas</p>';
    }
}

// Genera el HTML de una tarjeta a partir de sus datos
function crearTarjetaHTML(tarjeta) {
    const div = document.createElement('div');
    div.className = 'tarjeta-item';

    div.innerHTML = `
        <div class="tarjeta-color" style="background: ${tarjeta.color};"></div>
        <div class="tarjeta-info">
            <div class="tarjeta-nombre">${tarjeta.nombre}</div>
            <div class="tarjeta-cierre">Cierre: día ${tarjeta.diaCierre}</div>
        </div>
        <button class="btn-editar">
            <i class="ti ti-pencil"></i>
        </button>
    `;

    return div;
}