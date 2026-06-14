// Botón eliminar — por ahora muestra una confirmación
// En la versión real esto va a borrar la cuota de Firebase
const btnEliminar = document.querySelector('.btn-eliminar');

btnEliminar.addEventListener('click', function() {
    const confirmar = confirm('¿Segura que querés eliminar esta cuota?');
    if (confirmar) {
        // Acá más adelante va el código para borrar de Firebase
        window.location.href = 'home.html';
    }
});