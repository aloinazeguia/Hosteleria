document.addEventListener("DOMContentLoaded",()=>{
   const fecha = localStorage.getItem("fecha");
    const numComensales = localStorage.getItem("personas");
    const numMesa = localStorage.getItem("mesaSeleccionada");
    const resumen = document.getElementsByClassName("FechaReserva");
    const datos = resumen[0].querySelectorAll("p");
 
    if (datos.length >= 1) {
      datos[0].innerHTML = `<p><strong>DÍA:</strong>${fecha}</p>`;
      datos[1].innerHTML = `<p><strong>Personas:</strong>${numComensales}</p> `;
      datos[2].innerHTML =`<p><strong>Mesa:</strong>${numMesa}</p>`
    }
  
    // Insertar datos en los párrafos del resumen
   /*const fechaReserva = document.getElementById('Fecha');
    const visualfecha = document.createElement('p');
    visualfecha.innerText=fecha;
    fechaReserva.appendChild(visualfecha);
    const PersonasReserva = document.getElementById('personas');
    const visualpersona = document.createElement('p');
    visualpersona.innerText=numComensales;
    PersonasReserva.appendChild(visualpersona);*/
})
function DatosUsuario(){
      const nombre= document.getElementById("nombre").value;
      const apellido= document.getElementById("apellido").value;
      const telefono = document.getElementById("telefono").value;
      const email = document.getElementById("email").value;
      const observaciones = document.getElementById("comentarios").value;
      const fecha = localStorage.getItem("fecha");
      const numComensales = localStorage.getItem("personas");
      const numMesa = localStorage.getItem("mesaSeleccionada");
   
     
// Obtener valores del formulario
     
      const datos = {
        fecha:fecha,
        numMesa:numMesa,
        nombreCliente:nombre,
        apellidoCliente:apellido,
        telefonoCliente:telefono,
        emailCliente:email,
        numComensales:numComensales,
        observaciones:observaciones
         //hora: hora
      };

    fetch("http://localhost:3000/PostReservar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datos)
  })
  .then(response => response.json())
  .then(data => {
    if (data && data.ok === false) {
      // Rechazada por el backend (p.ej. comensales > capacidad de la mesa)
      alert("❌ " + data.error);
      return;
    }
    alert("Reserva Exitosa");
    localStorage.clear();
    window.location.href = "/Salas_/sala1.html";
  })
  .catch(error => {
    console.error("Error al enviar reserva:", error);
    alert("Error al Reservar");
  });
}