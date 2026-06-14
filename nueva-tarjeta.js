 // Preview del nombre en tiempo real
        const inputNombre = document.querySelector('input[type="text"]');
        const previewNombre = document.getElementById('preview-nombre');
 
        inputNombre.addEventListener('input', function() {
            previewNombre.textContent = this.value || 'Nombre de la tarjeta';
        });
 
        // Selector de color
        const colorOpts = document.querySelectorAll('.color-opt');
        const previewColor = document.getElementById('preview-color');
 
        colorOpts.forEach(btn => {
            btn.addEventListener('click', function() {
                // Sacar seleccionado anterior
                colorOpts.forEach(b => b.classList.remove('selected'));
                // Marcar el nuevo
                this.classList.add('selected');
                // Actualizar preview
                previewColor.style.background = this.dataset.color;
            });
        });