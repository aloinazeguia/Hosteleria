function FechaReserva() {
  const numComensales = document.getElementById("personas").value;
  const fecha = document.getElementById("fecha").value;

  localStorage.setItem("personas", numComensales);
  localStorage.setItem("fecha", fecha);

  const url = `http://localhost:3000/GetMesasLibresFecha?numComensales=${encodeURIComponent(numComensales)}&fecha=${encodeURIComponent(fecha)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.mesas.length !== 0) {
        // Mostrar el div de selección de mesa
        document.getElementById("sala1").style.display = "block";
      } else {
        alert("❌ No hay disponibilidad para esta fecha y número de personas.");
      }
    })
    .catch(error => {
      console.error("Error:"+ error);
     // alert("❌ Error al consultar disponibilidad.");
    });
}
