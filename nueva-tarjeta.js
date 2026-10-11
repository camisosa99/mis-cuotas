// nueva-tarjeta.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- Detectamos si venimos a editar (?id=XXX) o a crear ---
const params = new URLSearchParams(window.location.search);
const tarjetaId = params.get('id'); // null si es "nueva"

let usuarioActual = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    usuarioActual = user;

    if (tarjetaId) {
        await cargarTarjetaParaEditar(tarjetaId);
    }
});

// --- Referencias del DOM ---
const inputNombre = document.getElementById('input-nombre');
const previewNombre = document.getElementById('preview-nombre');
const inputCierre = document.getElementById('input-cierre');
const formTitle = document.getElementById('form-title');
const btnGuardar = document.querySelector('.btn-guardar');
const btnEliminar = document.getElementById('btn-eliminar');

// --- Preview del nombre en tiempo real ---
inputNombre.addEventListener('input', function() {
    previewNombre.textContent = this.value || 'Nombre de la tarjeta';
});

// Trae las cuotas de esta tarjeta (las del usuario actual)
async function obtenerCuotasDeTarjeta() {
    const q = query(
        collection(db, 'cuotas'),
        where('userId', '==', usuarioActual.uid),
        where('tarjetaId', '==', tarjetaId)
    );
    return await getDocs(q);
}

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

// --- Si estamos editando, cargamos los datos existentes ---
async function cargarTarjetaParaEditar(id) {
    try {
        const ref = doc(db, 'tarjetas', id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            alert('No se encontró la tarjeta');
            window.location.href = 'tarjetas.html';
            return;
        }

        const tarjeta = snap.data();

        // Seguridad extra en el cliente: que sea tuya (las reglas ya lo bloquean igual)
        if (tarjeta.userId !== usuarioActual.uid) {
            alert('No tenés permiso para editar esta tarjeta');
            window.location.href = 'tarjetas.html';
            return;
        }

        // Rellenamos el formulario
        inputNombre.value = tarjeta.nombre;
        previewNombre.textContent = tarjeta.nombre;
        inputCierre.value = tarjeta.diaCierre;
        colorSeleccionado = tarjeta.color;
        previewColor.style.background = tarjeta.color;

        colorOpts.forEach(b => {
            b.classList.toggle('selected', b.dataset.color === tarjeta.color);
        });

        // Ajustamos textos y mostramos el botón eliminar
        formTitle.textContent = 'Editar tarjeta';
        btnGuardar.textContent = 'Guardar cambios';
        btnEliminar.style.display = 'block';

    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al cargar la tarjeta');
        window.location.href = 'tarjetas.html';
    }
}

// --- Guardar (crear o actualizar según corresponda) ---
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
        if (tarjetaId) {
            // --- Modo edición: actualizamos la tarjeta y sus cuotas juntas ---
            const batch = writeBatch(db);

            batch.update(doc(db, 'tarjetas', tarjetaId), {
                nombre: nombre,
                color: colorSeleccionado,
                diaCierre: Number(diaCierre)
            });

            const cuotasSnap = await obtenerCuotasDeTarjeta();

            cuotasSnap.forEach((c) => {
                batch.update(c.ref, {
                    tarjetaNombre: nombre,
                    tarjetaColor: colorSeleccionado
                });
            });

            await batch.commit();
        } else {
            // --- Modo creación ---
            await addDoc(collection(db, 'tarjetas'), {
                nombre: nombre,
                color: colorSeleccionado,
                diaCierre: Number(diaCierre),
                userId: usuarioActual.uid
            });
        }

        window.location.href = 'tarjetas.html';
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al guardar la tarjeta. Intentá de nuevo.');
    }
});

// --- Eliminar ---
btnEliminar.addEventListener('click', async () => {
    try {
        // Primero chequeamos que no tenga cuotas cargadas
        const cuotasSnap = await obtenerCuotasDeTarjeta();

        if (!cuotasSnap.empty) {
            const n = cuotasSnap.size;
            alert(`No se puede eliminar: esta tarjeta tiene ${n} ${n === 1 ? 'cuota cargada' : 'cuotas cargadas'}. Eliminá esas cuotas o pasalas a otra tarjeta (desde su pantalla de edición) y después volvé a intentar.`);
            return;
        }

        const confirmar = confirm('¿Seguro que querés eliminar esta tarjeta? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        await deleteDoc(doc(db, 'tarjetas', tarjetaId));
        window.location.href = 'tarjetas.html';
    } catch (error) {
        console.error(error);
        alert('Ocurrió un error al eliminar la tarjeta. Intentá de nuevo.');
    }
});