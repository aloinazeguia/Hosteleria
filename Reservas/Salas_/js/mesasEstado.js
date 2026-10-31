import { AlertConfirm } from "/components/AlertComponents.js";

export async function actualizarEstado(){
      //const fecha = new Date().toISOString().slice(0,10);
      const fecha=localStorage.getItem("fecha");
  const mesas = document.getElementsByClassName("mesa");

    const estados = await cargarEstadosDesdeJSON(fecha);

    Array.from(mesas).forEach(mesa => {
        const ID = parseInt(mesa.dataset.id);
        const mesaEstado = estados.estados.find(m => m.idMesa === ID);
        if (mesaEstado) {
            cambiarColorMesa(mesa, mesaEstado.estado);
        }
    });
}

 async function cargarEstadosDesdeJSON(fecha) {
    try {
        const response = await fetch(`http://localhost:3000/GetEstadoMesas?fecha=${fecha}`);  // const response = await fetch('http://localhost:3000/GetmesasEsado?idMesa=${idMesa}'); 
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al cargar el archivo:', error);
        return [];
    }
}

async function cambiarColorMesa(mesaElemento, estado) {
   if (estado==0) {
     mesaElemento.style.backgroundColor = "green"; // Libre
     mesaElemento.addEventListener('click', async function() {
      let message='¿estas seguro que quieres esa mesa?';
      let redirection= "/Reservas/html/iconfirmacion.html";
      
      if(await AlertConfirm(message)){
         const idMesa = this.getAttribute('data-id');         
         localStorage.setItem('mesaSeleccionada', idMesa);
          window.location.href = redirection;
      }
     })

   
               
   } else if (estado==1 || estado==2 || estado==3) {
     mesaElemento.style.backgroundColor = "red"; // Reservado
     /*mesaElemento.addEventListener('click', function() {
                const idMesa = this.getAttribute('data-id'); 
                localStorage.setItem('mesaSeleccionada', idMesa);
                 window.location.href = '/Reservas/html/iconfirmacion.html'});*/
  }

}
