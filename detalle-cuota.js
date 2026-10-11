// detalle-cuota.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// --- ¿Qué cuota estamos viendo? (?id=XXX en la URL) ---
const cuotaId = new URLSearchParams(window.location.search).get('id');

if (!cuotaId) {
    window.location.href = 'home.html';
}
document.getElementById('btn-editar').href = `nueva-cuota.html?id=${cuotaId}`;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    await cargarDetalle(user.uid);
});

async function cargarDetalle(userId) {
    try {
        const snap = await getDoc(doc(db, 'cuotas', cuotaId));

        if (!snap.exists() || snap.data().userId !== userId) {
            alert('No se encontró la cuota');
            window.location.href = 'home.html';
            return;
        }

        const cuota = snap.data();

        // El día de cierre vive en la tarjeta, no en la cuota
        let diaCierre = null;
        try {
            const tarjetaSnap = await getDoc(doc(db, 'tarjetas', cuota.tarjetaId));
            if (tarjetaSnap.exists()) diaCierre = tarjetaSnap.data().diaCierre;
        } catch (e) {
            console.error(e); // si falla, simplemente no mostramos el cierre
        }

        renderDetalle(cuota, diaCierre);

    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al cargar la cuota');
        window.location.href = 'home.html';
    }
}

// --- Helpers ---
function formatearMonto(valor) {
    return '$' + Math.round(valor).toLocaleString('es-AR');
}

// Devuelve { anio, mes } (mes 0-11) de la cuota número "n" (1 = primera)
function mesDeCuota(mesPrimeraCuota, n) {
    const [anio, mes] = mesPrimeraCuota.split('-').map(Number);
    const fecha = new Date(anio, mes - 1 + (n - 1), 1);
    return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
}

function formatearFechaCompra(fechaCompra) {
    // "2026-04-28" -> "28 abr" (sin pasar por Date para evitar líos de zona horaria)
    const [, mes, dia] = fechaCompra.split('-').map(Number);
    return `${dia} ${MESES[mes - 1].slice(0, 3).toLowerCase()}`;
}

function pluralCuotas(n) {
    return n === 1 ? '1 cuota' : `${n} cuotas`;
}

// --- Dibuja toda la pantalla ---
function renderDetalle(cuota, diaCierre) {
    const total = cuota.totalCuotas;
    const hoy = new Date();

    // Número de cuota que corresponde a este mes (puede ser <1 o >total)
    const [anioInicio, mesInicio] = cuota.mesPrimeraCuota.split('-').map(Number);
    const numeroBruto = (hoy.getFullYear() - anioInicio) * 12 + (hoy.getMonth() - (mesInicio - 1)) + 1;
    const pagadas = Math.min(Math.max(numeroBruto, 0), total);
    const faltan = total - pagadas;

    // Header
    document.getElementById('detalle-nombre').textContent = cuota.nombre;
    document.getElementById('detalle-subtitulo').textContent =
        `${cuota.tarjetaNombre} · comprado el ${formatearFechaCompra(cuota.fechaCompra)}`;

    // Hero
    let etiquetaHero;
    if (numeroBruto < 1) etiquetaHero = `Todavía no empezó · ${total} cuotas`;
    else if (numeroBruto > total) etiquetaHero = `Finalizada · ${total} de ${total}`;
    else etiquetaHero = `Cuota actual · ${numeroBruto} de ${total}`;

    document.getElementById('hero-label').textContent = etiquetaHero;
    document.getElementById('hero-monto').textContent = formatearMonto(cuota.montoCuota);
    document.getElementById('hero-sub').textContent = `Total de la compra: ${formatearMonto(cuota.montoTotal)}`;
    document.getElementById('hero-progreso').style.width = `${Math.round((pagadas / total) * 100)}%`;

    // Grilla de datos
    document.getElementById('dato-pagado').textContent = formatearMonto(cuota.montoCuota * pagadas);
    document.getElementById('dato-pagado-sub').textContent = pluralCuotas(pagadas);
    document.getElementById('dato-falta').textContent = formatearMonto(cuota.montoCuota * faltan);
    document.getElementById('dato-falta-sub').textContent = pluralCuotas(faltan);

    document.getElementById('dato-tarjeta').textContent = cuota.tarjetaNombre;
    document.getElementById('dato-tarjeta-dot').style.background = cuota.tarjetaColor;
    document.getElementById('dato-cierre').textContent = diaCierre ? `Cierre día ${diaCierre}` : '';

    const ultima = mesDeCuota(cuota.mesPrimeraCuota, total);
    document.getElementById('dato-ultima').textContent =
        `${MESES[ultima.mes].slice(0, 3)} ${ultima.anio}`;
    document.getElementById('dato-ultima-sub').textContent =
    numeroBruto > total ? 'Finalizada'
    : numeroBruto === total ? 'Este mes'
    : (faltan === 1 ? '1 mes más' : `${faltan} meses más`);
    // Timeline
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    for (let i = 1; i <= total; i++) {
        const { anio, mes } = mesDeCuota(cuota.mesPrimeraCuota, i);
        let estado, icono, badge = '', claseNombre = '', claseMonto = '';

        if (i < numeroBruto) {
            estado = 'tl-done';
            icono = '<i class="ti ti-check"></i>';
        } else if (i === numeroBruto) {
            estado = 'tl-actual';
            icono = '<i class="ti ti-credit-card"></i>';
            badge = ' <span class="tl-badge">este mes</span>';
            claseMonto = ' tl-monto-actual';
        } else {
            estado = 'tl-pendiente';
            icono = '';
            claseNombre = ' tl-nombre-pendiente';
        }

        const item = document.createElement('div');
        item.className = 'tl-item';
        item.innerHTML = `
            <div class="tl-dot ${estado}">${icono}</div>
            <div class="tl-info">
                <div class="tl-nombre${claseNombre}">Cuota ${i} de ${total}${badge}</div>
                <div class="tl-fecha">${MESES[mes]} ${anio}</div>
            </div>
            <div class="tl-monto${claseMonto}">${formatearMonto(cuota.montoCuota)}</div>
        `;
        timeline.appendChild(item);
    }

    // Notas (si no hay, ocultamos la sección entera)
    if (cuota.notas) {
        document.getElementById('detalle-notas').textContent = cuota.notas;
    } else {
        document.getElementById('seccion-notas').style.display = 'none';
    }
}

// --- Eliminar ---
document.getElementById('btn-eliminar').addEventListener('click', async () => {
    const confirmar = confirm('¿Segura que querés eliminar esta cuota?');
    if (!confirmar) return;

    try {
        await deleteDoc(doc(db, 'cuotas', cuotaId));
        window.location.href = 'home.html';
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al eliminar la cuota. Intentá de nuevo.');
    }
});