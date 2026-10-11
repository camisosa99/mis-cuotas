// nueva-cuota.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let usuarioActual = null;
let tarjetaSeleccionada = null; // { id, nombre, color }

const tarjetaSelector = document.querySelector('.tarjeta-selector');

// --- Protegemos la pantalla y cargamos las tarjetas del usuario ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    usuarioActual = user;
    await cargarTarjetas(user.uid);
});

async function cargarTarjetas(userId) {
    try {
        const q = query(collection(db, 'tarjetas'), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tarjetaSelector.innerHTML = '<p style="color:#94a3b8; font-size:13px;">Primero agregá una tarjeta</p>';
            return;
        }

        tarjetaSelector.innerHTML = ''; // limpiamos las opciones hardcodeadas

        snapshot.docs.forEach((doc, index) => {
            const tarjeta = doc.data();
            const btn = crearTarjetaOptHTML(doc.id, tarjeta, index === 0);
            tarjetaSelector.appendChild(btn);
        });

        // Seleccionamos la primera por defecto
        const primera = snapshot.docs[0];
        tarjetaSeleccionada = { id: primera.id, ...primera.data() };

    } catch (error) {
        console.error(error);
        tarjetaSelector.innerHTML = '<p style="color:#ef4444; font-size:13px;">Error al cargar tus tarjetas</p>';
    }
}

function crearTarjetaOptHTML(id, tarjeta, seleccionada) {
    const btn = document.createElement('button');
    btn.className = 'tarjeta-opt' + (seleccionada ? ' selected' : '');
    btn.dataset.id = id;

    btn.innerHTML = `
        <div class="tarjeta-opt-color" style="background: ${tarjeta.color};"></div>
        <span>${tarjeta.nombre}</span>
    `;

    btn.addEventListener('click', () => {
        document.querySelectorAll('.tarjeta-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        tarjetaSeleccionada = { id, ...tarjeta };
    });

    return btn;
}

// --- Toggle por cuota / total ---
const btnPorCuota = document.getElementById('btn-por-cuota');
const btnTotal = document.getElementById('btn-total');
const montoHint = document.getElementById('monto-hint');
let modoMonto = 'cuota'; // 'cuota' | 'total'

btnPorCuota.addEventListener('click', function() {
    modoMonto = 'cuota';
    btnPorCuota.classList.add('active');
    btnTotal.classList.remove('active');
    montoHint.textContent = 'Ingresá el valor de cada cuota';
});

btnTotal.addEventListener('click', function() {
    modoMonto = 'total';
    btnTotal.classList.add('active');
    btnPorCuota.classList.remove('active');
    montoHint.textContent = 'Ingresá el valor total de la compra';
});

// --- Guardar cuota ---
const btnGuardar = document.querySelector('.btn-guardar');

btnGuardar.addEventListener('click', async () => {
    const nombre = document.getElementById('input-nombre').value.trim();
    const monto = Number(document.getElementById('input-monto').value);
    const totalCuotas = Number(document.getElementById('input-total-cuotas').value);
    const cuotaActual = Number(document.getElementById('input-cuota-actual').value);
    const fechaCompra = document.getElementById('input-fecha').value;
    const notas = document.getElementById('input-notas').value.trim();

    // --- Validaciones ---
    if (!nombre) {
        alert('Por favor ingresá el nombre de la compra');
        return;
    }
    if (!tarjetaSeleccionada) {
        alert('Seleccioná una tarjeta');
        return;
    }
    if (!monto || monto <= 0) {
        alert('Ingresá un monto válido');
        return;
    }
    if (!totalCuotas || totalCuotas < 1) {
        alert('Ingresá la cantidad de cuotas');
        return;
    }
    if (!cuotaActual || cuotaActual < 1 || cuotaActual > totalCuotas) {
        alert('La cuota actual debe estar entre 1 y la cantidad total de cuotas');
        return;
    }
    if (!fechaCompra) {
        alert('Ingresá la fecha de compra');
        return;
    }
    if (!usuarioActual) {
        alert('Tenés que iniciar sesión para guardar una cuota');
        return;
    }

    // --- Calculamos monto por cuota y monto total según el modo ---
    const montoCuota = modoMonto === 'cuota' ? monto : monto / totalCuotas;
    const montoTotal = modoMonto === 'total' ? monto : monto * totalCuotas;
    // Mes en que cayó la cuota 1 (formato "2026-05"), calculado desde la cuota actual
    const hoy = new Date();
    const primerMes = new Date(hoy.getFullYear(), hoy.getMonth() - (cuotaActual - 1), 1);
    const mesPrimeraCuota = `${primerMes.getFullYear()}-${String(primerMes.getMonth() + 1).padStart(2, '0')}`;

    try {
        await addDoc(collection(db, 'cuotas'), {
            nombre: nombre,
            tarjetaId: tarjetaSeleccionada.id,
            tarjetaNombre: tarjetaSeleccionada.nombre,
            tarjetaColor: tarjetaSeleccionada.color,
            montoCuota: montoCuota,
            montoTotal: montoTotal,
            totalCuotas: totalCuotas,
            cuotaActual: cuotaActual,
            mesPrimeraCuota: mesPrimeraCuota,
            fechaCompra: fechaCompra,
            notas: notas,
            userId: usuarioActual.uid
        });

        window.location.href = 'home.html';
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al guardar la cuota. Intentá de nuevo.');
    }
});