import { AlertMessage } from "../../components/AlertComponents.js";

document.querySelector("#FechaReserva").addEventListener("submit", function(event) {
    event.preventDefault();
    const numComensales = document.getElementById("personas").value;
    const fecha = document.getElementById("fecha").value;
    //const hora = document.getElementById("hora").value;
    localStorage.setItem("personas",numComensales);
    localStorage.setItem("fecha", fecha);
    //localStorage.setItem("hora",hora);
  
    const url = `http://localhost:3000/GetMesasLibresFecha?numComensales=${encodeURIComponent(numComensales)}&fecha=${encodeURIComponent(fecha)}`;

    fetch(url, {
      method: "GET"
    })
    .then(response => response.json())
    .then(data => {
      if (data.mesas.length!=0) {
        //alert(`✅ Hay disponibilidad para ${personas} personas ${fecha}.`);
        const numMesa=data.mesas[0].numMesa;
        localStorage.setItem("numMesa",numMesa);
        window.location.href = '/Reservas/html/iconfirmacion.html';
        
      } else if (data.length== 0) {
        let message=`❌ No hay disponibilidad para esta ${fecha}`;
        AlertMessage(message);

      } else {
        alert("⚠️ " + (data.error || "Error al comprobar disponibilidad."));
      }
    })
   .catch(error => {
      console.error("Error:", error);
      alert("❌ Error al conectar con el servidor.");
    
    });
  });