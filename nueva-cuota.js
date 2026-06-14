// --- Toggle por cuota / total ---
const btnPorCuota = document.getElementById('btn-por-cuota');
const btnTotal = document.getElementById('btn-total');
const montoHint = document.getElementById('monto-hint');

btnPorCuota.addEventListener('click', function() {
    btnPorCuota.classList.add('active');
    btnTotal.classList.remove('active');
    montoHint.textContent = 'Ingresá el valor de cada cuota';
});

btnTotal.addEventListener('click', function() {
    btnTotal.classList.add('active');
    btnPorCuota.classList.remove('active');
    montoHint.textContent = 'Ingresá el valor total de la compra';
});

// --- Selector de tarjeta ---
const tarjetaOpts = document.querySelectorAll('.tarjeta-opt');

tarjetaOpts.forEach(btn => {
    btn.addEventListener('click', function() {
        tarjetaOpts.forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
    });
});