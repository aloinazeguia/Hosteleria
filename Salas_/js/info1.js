// Walk-in: pantalla de comensales con validacion de capacidad
// Se llega desde una mesa LIBRE (verde) del plano de salas
const mesa = localStorage.getItem('mesaSeleccionada');
const numeroSpan = document.querySelector('.numero');
const title = document.getElementById('title');
const entradaInput = document.querySelector('.entrada');
const botonAceptar = document.querySelector('.boton-aceptar');

let capacidadMax = null;

if (!mesa) {
    alert('No se ha seleccionado ninguna mesa. Vuelva al plano de salas.');
    window.location.href = '/Salas_/sala1.html';
} else {
    if (title) title.textContent = `MESA ${mesa}`;
    // Consultar la capacidad real de la mesa al backend
    fetch(`http://localhost:3000/GetMesa?numMesa=${mesa}`)
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(data => {
            capacidadMax = data.mesa.capacidad;
            if (numeroSpan) numeroSpan.textContent = capacidadMax;
        })
        .catch(error => {
            console.error('Error al consultar la capacidad de la mesa:', error);
            if (numeroSpan) numeroSpan.textContent = '-';
        });
}

botonAceptar.addEventListener('click', async function () {
    const cantidadIngresada = parseInt(entradaInput.value);
    if (isNaN(cantidadIngresada) || cantidadIngresada <= 0) {
        alert('Por favor, ingresa un número válido de comensales.');
        return;
    }

    // VALIDACION: no superar la capacidad de la mesa
    if (capacidadMax !== null && cantidadIngresada > capacidadMax) {
        alert(`❌ La mesa ${mesa} admite como máximo ${capacidadMax} comensales.`);
        entradaInput.value = '';
        return;
    }

    localStorage.setItem('comensalesMesa', cantidadIngresada);
    localStorage.setItem('datosMesa', JSON.stringify({
        mesa: mesa,
        hora: new Date().toLocaleTimeString(),
        fecha: new Date().toLocaleDateString()
    }));
    window.location.href = '/Comandero/html/menu.html';
});
