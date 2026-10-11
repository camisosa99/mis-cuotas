// nueva-cuota.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- ¿Venimos a editar (?id=XXX) o a crear? ---
const cuotaId = new URLSearchParams(window.location.search).get('id'); // null = cuota nueva

let usuarioActual = null;
let tarjetaSeleccionada = null;   // { id, nombre, color, diaCierre, ... }
const tarjetasPorId = {};         // para encontrar rápido la tarjeta de una cuota
let modoMonto = 'cuota';          // 'cuota' | 'total'

// --- Referencias del DOM ---
const tarjetaSelector = document.querySelector('.tarjeta-selector');
const inputNombre = document.getElementById('input-nombre');
const inputMonto = document.getElementById('input-monto');
const inputTotalCuotas = document.getElementById('input-total-cuotas');
const inputFecha = document.getElementById('input-fecha');
const inputNotas = document.getElementById('input-notas');
const formTitle = document.getElementById('form-title');
const btnGuardar = document.querySelector('.btn-guardar');

// --- Protegemos la pantalla, cargamos tarjetas y (si corresponde) la cuota ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    usuarioActual = user;

    await cargarTarjetas(user.uid);

    if (cuotaId) {
        await cargarCuotaParaEditar(cuotaId);
    }
});

async function cargarTarjetas(userId) {
    try {
        const q = query(collection(db, 'tarjetas'), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tarjetaSelector.innerHTML = '<p style="color:#94a3b8; font-size:13px;">Primero agregá una tarjeta</p>';
            return;
        }

        tarjetaSelector.innerHTML = '';

        snapshot.docs.forEach((d, index) => {
            const tarjeta = { id: d.id, ...d.data() };
            tarjetasPorId[d.id] = tarjeta;
            // En modo "nueva" dejamos la primera preseleccionada; al editar se elige la de la cuota
            const preseleccionada = !cuotaId && index === 0;
            tarjetaSelector.appendChild(crearTarjetaOptHTML(tarjeta, preseleccionada));
        });

        if (!cuotaId) {
            tarjetaSeleccionada = tarjetasPorId[snapshot.docs[0].id];
        }

    } catch (error) {
        console.error(error);
        tarjetaSelector.innerHTML = '<p style="color:#ef4444; font-size:13px;">Error al cargar tus tarjetas</p>';
    }
}

function crearTarjetaOptHTML(tarjeta, seleccionada) {
    const btn = document.createElement('button');
    btn.className = 'tarjeta-opt' + (seleccionada ? ' selected' : '');
    btn.dataset.id = tarjeta.id;

    btn.innerHTML = `
        <div class="tarjeta-opt-color" style="background: ${tarjeta.color};"></div>
        <span>${tarjeta.nombre}</span>
    `;

    btn.addEventListener('click', () => {
        marcarTarjetaEnUI(tarjeta.id);
        tarjetaSeleccionada = tarjeta;
    });

    return btn;
}

function marcarTarjetaEnUI(id) {
    document.querySelectorAll('.tarjeta-opt').forEach(b => {
        b.classList.toggle('selected', b.dataset.id === id);
    });
}

// --- Toggle por cuota / total ---
const btnPorCuota = document.getElementById('btn-por-cuota');
const btnTotal = document.getElementById('btn-total');
const montoHint = document.getElementById('monto-hint');

function setModoMonto(modo) {
    modoMonto = modo;
    btnPorCuota.classList.toggle('active', modo === 'cuota');
    btnTotal.classList.toggle('active', modo === 'total');
    montoHint.textContent = modo === 'cuota'
        ? 'Ingresá el valor de cada cuota'
        : 'Ingresá el valor total de la compra';
}

btnPorCuota.addEventListener('click', () => setModoMonto('cuota'));
btnTotal.addEventListener('click', () => setModoMonto('total'));

// --- Si estamos editando, rellenamos el formulario ---
async function cargarCuotaParaEditar(id) {
    try {
        const snap = await getDoc(doc(db, 'cuotas', id));

        if (!snap.exists() || snap.data().userId !== usuarioActual.uid) {
            alert('No se encontró la cuota');
            window.location.href = 'home.html';
            return;
        }

        const cuota = snap.data();

        inputNombre.value = cuota.nombre;
        inputTotalCuotas.value = cuota.totalCuotas;
        inputFecha.value = cuota.fechaCompra;
        inputNotas.value = cuota.notas || '';

        // El monto se muestra como valor por cuota
        setModoMonto('cuota');
        inputMonto.value = cuota.montoCuota;

        // Tarjeta: si todavía existe la marcamos; si no, que elija otra
        const tarjeta = tarjetasPorId[cuota.tarjetaId];
        if (tarjeta) {
            tarjetaSeleccionada = tarjeta;
            marcarTarjetaEnUI(tarjeta.id);
        } else {
            tarjetaSeleccionada = null;
            marcarTarjetaEnUI(null);
            alert('La tarjeta de esta cuota ya no existe. Elegí otra para guardar los cambios.');
        }

        formTitle.textContent = 'Editar cuota';
        btnGuardar.textContent = 'Guardar cambios';

    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al cargar la cuota');
        window.location.href = 'home.html';
    }
}

// --- Guardar (crear o actualizar) ---
btnGuardar.addEventListener('click', async () => {
    const nombre = inputNombre.value.trim();
    const monto = Number(inputMonto.value);
    const totalCuotas = Number(inputTotalCuotas.value);
    const fechaCompra = inputFecha.value;
    const notas = inputNotas.value.trim();

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
    if (!fechaCompra) {
        alert('Ingresá la fecha de compra');
        return;
    }
    if (!usuarioActual) {
        alert('Tenés que iniciar sesión para guardar una cuota');
        return;
    }

    // --- Montos según el modo ---
    const montoCuota = modoMonto === 'cuota' ? monto : monto / totalCuotas;
    const montoTotal = modoMonto === 'total' ? monto : monto * totalCuotas;

    // --- Mes de la primera cuota según fecha de compra y cierre de la tarjeta ---
    const [anioCompra, mesCompra, diaCompra] = fechaCompra.split('-').map(Number);
    const mesesHastaPrimeraCuota = diaCompra <= tarjetaSeleccionada.diaCierre ? 1 : 2;
    const primera = new Date(anioCompra, mesCompra - 1 + mesesHastaPrimeraCuota, 1);
    const mesPrimeraCuota = `${primera.getFullYear()}-${String(primera.getMonth() + 1).padStart(2, '0')}`;

    const datos = {
        nombre: nombre,
        tarjetaId: tarjetaSeleccionada.id,
        tarjetaNombre: tarjetaSeleccionada.nombre,
        tarjetaColor: tarjetaSeleccionada.color,
        montoCuota: montoCuota,
        montoTotal: montoTotal,
        totalCuotas: totalCuotas,
        mesPrimeraCuota: mesPrimeraCuota,
        fechaCompra: fechaCompra,
        notas: notas
    };

    try {
        if (cuotaId) {
            // --- Modo edición ---
            await updateDoc(doc(db, 'cuotas', cuotaId), datos);
            window.location.href = `detalle-cuota.html?id=${cuotaId}`;
        } else {
            // --- Modo creación ---
            await addDoc(collection(db, 'cuotas'), { ...datos, userId: usuarioActual.uid });
            window.location.href = 'home.html';
        }
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al guardar la cuota. Intentá de nuevo.');
    }
});