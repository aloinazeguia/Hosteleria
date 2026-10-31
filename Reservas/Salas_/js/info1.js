const idMesa = localStorage.getItem('mesaSeleccionada');
const numeroSpan = document.querySelector('.numero');
const entradaInput = document.querySelector('.entrada');
const botonAceptar = document.querySelector('.boton-aceptar');

/* aqui va la llamada a la api para que devuelva la capacidad de la mesa segun su idMesa*/


// if (idMesa){
//   consultarCapacidad(idMesa)
// }else {
//   console.error('No se selecciono ninguna mesa');
//   alert('No se selecciono ninguna mesa');
// }

// function consultarCapacidad(idMesa) {
//   // const url = `http://localhost:3000/GetMesa?idMesa=${idMesa}/capacidad`;
//   const url = "./json/salas.json";
//   fetch(url)
//     .then(response => {
//       if (!response.ok) {
//         throw new Error('Error de red: ' + response.status);
//       }
//       return response.json();
//     })
//     .then(data => {
//       //Se modifica para que se ajuste al json de prueba
//       // Buscar la mesa por id en todas las salas
//       let capacidad = null;
//       for (const sala of data.salas) {
//         const mesa = sala.mesas.find(m => m.id == idMesa);
//         if (mesa) {
//           capacidad = mesa.capacidad;
//           break;
//         }
//       }
//       if (capacidad !== null) {
//         console.log(`Capacidad de la mesa ${idMesa}:`, capacidad);
//         numeroSpan.textContent = capacidad;
//       } else {
//         console.error('No se encontró la mesa con id', idMesa);
//         alert('No se encontró la mesa seleccionada.');
//       }
//     })
//     .catch(error=>{
//       console.error('Error al consultar la capacidad de la mesa ;', error);
//       alert('Error al consultar la capacidad de la mesa. Por favor, vuelve a intentarlo mas tarde.')

//     })
//   }




botonAceptar.addEventListener('click', function() {
  const cantidadIngresada = parseInt(entradaInput.value);
  if (isNaN(cantidadIngresada) || cantidadIngresada <= 0) {
    alert('Por favor, ingresa un número válido de comensales.');
    return;
  }
/*
  // Validar que no supere la capacidad
  const capacidadMax = parseInt(numeroSpan.textContent);
  if (cantidadIngresada > capacidadMax) {
    alert(`La cantidad ingresada supera la capacidad máxima de la mesa (${capacidadMax}).`);
    return;
  }
     */
  localStorage.setItem('comensalesMesa', cantidadIngresada);
  window.location.href = '../Comandero/html/menu.html';
});