// home.js

import { auth, db } from './firebase.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const monthLabel = document.getElementById('month-label');
const totalAmount = document.getElementById('total-amount');
const totalCards = document.getElementById('total-cards');
const cuotasList = document.getElementById('cuotas-list');

let cuotas = [];   // todas las cuotas del usuario, traídas una sola vez
const hoy = new Date();
let anioActual = hoy.getFullYear();
let mesActual = hoy.getMonth(); // 0 = enero

// --- Protección de ruta + carga inicial ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    await cargarCuotas(user.uid);
});

async function cargarCuotas(userId) {
    try {
        const q = query(collection(db, 'cuotas'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        cuotas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderMes();
    } catch (error) {
        console.error(error);
        cuotasList.innerHTML = '<p style="text-align:center; color:#ef4444; font-size:13px;">Ocurrió un error al cargar tus cuotas</p>';
    }
}

// --- Cálculo: ¿qué número de cuota cae en el mes que estoy viendo? ---
function numeroCuotaEnMes(cuota) {
    if (!cuota.mesPrimeraCuota) return null; // documentos viejos sin el campo

    const [anioInicio, mesInicio] = cuota.mesPrimeraCuota.split('-').map(Number);
    const diferencia = (anioActual - anioInicio) * 12 + (mesActual - (mesInicio - 1));
    const numero = diferencia + 1;

    if (numero < 1 || numero > cuota.totalCuotas) return null;
    return numero;
}

function formatearMonto(valor) {
    return '$' + Math.round(valor).toLocaleString('es-AR');
}

// --- Dibuja todo para el mes seleccionado ---
function renderMes() {
    monthLabel.textContent = `${MESES[mesActual]} ${anioActual}`;

    // Cuotas que caen en este mes, con su número de cuota
    const delMes = cuotas
        .map(c => ({ ...c, numero: numeroCuotaEnMes(c) }))
        .filter(c => c.numero !== null);

    // Total y desglose por tarjeta
    const total = delMes.reduce((suma, c) => suma + c.montoCuota, 0);
    const porTarjeta = {};
    delMes.forEach(c => {
        porTarjeta[c.tarjetaNombre] = (porTarjeta[c.tarjetaNombre] || 0) + c.montoCuota;
    });

    totalAmount.textContent = formatearMonto(total);
    totalCards.textContent = Object.entries(porTarjeta)
        .map(([nombre, monto]) => `${nombre} ${formatearMonto(monto)}`)
        .join(' · ');

    // Lista
    cuotasList.innerHTML = '';

    if (delMes.length === 0) {
        cuotasList.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:13px; padding:20px;">No tenés cuotas este mes</p>';
        return;
    }

    delMes.forEach(c => cuotasList.appendChild(crearCuotaHTML(c)));
}

function crearCuotaHTML(c) {
    const a = document.createElement('a');
    a.className = 'cuota-card';
    a.href = `detalle-cuota.html?id=${c.id}`;

    const progreso = Math.round((c.numero / c.totalCuotas) * 100);

    a.innerHTML = `
        <div class="cuota-dot" style="background: ${c.tarjetaColor};"></div>
        <div class="cuota-info">
            <div class="cuota-nombre">${c.nombre}</div>
            <div class="cuota-sub">cuota ${c.numero} de ${c.totalCuotas} · ${c.tarjetaNombre}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progreso}%; background: ${c.tarjetaColor};"></div>
            </div>
        </div>
        <div class="cuota-monto">${formatearMonto(c.montoCuota)}</div>
    `;

    return a;
}

// --- Navegación entre meses ---
document.getElementById('btn-mes-anterior').addEventListener('click', () => {
    mesActual--;
    if (mesActual < 0) {
        mesActual = 11;
        anioActual--;
    }
    renderMes();
});

document.getElementById('btn-mes-siguiente').addEventListener('click', () => {
    mesActual++;
    if (mesActual > 11) {
        mesActual = 0;
        anioActual++;
    }
    renderMes();
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