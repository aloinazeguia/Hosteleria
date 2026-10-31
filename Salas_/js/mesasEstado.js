//funcion que actualiza el estado de las mesas
export async function actualizarEstado(){
  //Se toma la fecha actual
  const fecha = new Date().toISOString().slice(0,10);
  //Se llama al contenedor que almacena las mesas
  const mesas = document.getElementsByClassName("mesa");
  //Se llama a la funcion que devuelve los estados segun la fecha
    const estados = await cargarEstadosDesdeJSON(fecha);
    //Se llama a la funcion que actualiza el contador, se le pasa la fecha como referencia
    actualizarContador(fecha);
    //Convierte la coleccion de HTML de mesas a un array iterable
    //de cada mesa saco su data-id para poder buscarlo en los estados de las mesas y asi poder actualizarlo
    Array.from(mesas).forEach(mesa => {
        const ID = parseInt(mesa.dataset.id);
        const mesaEstado = estados.estados.find(m => m.idMesa === ID);
        if (mesaEstado) {
            //funcion que cambia el estado, recibe el nodo y el estado, 
            cambiarColorMesa(mesa, mesaEstado.estado);
        }
    });
}
//funcion que hace la peticion get de los estados de las mesas segun la fecha
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
//funcion que cambia el color de las mesas
function cambiarColorMesa(mesaElemento, estado) {
  //Si el estado es 0 es libre y se pinta en verde. Clic -> WALK-IN
  if (estado == 0) {
    mesaElemento.style.backgroundColor = "green"; // Libre
    mesaElemento.addEventListener('click', function () {
      const idMesa = this.getAttribute('data-id');
      localStorage.setItem('mesaSeleccionada', idMesa);
      //Walk-in: primero se piden los comensales y luego el menu
      window.location.href = '/Salas_/info1.html';
    });
  } else if (estado == 1) {
   //Si es 1 esta ocupada (comanda abierta, con o sin reserva) se pinta en rojo
    mesaElemento.style.backgroundColor = "red"; // Ocupada / Reservada
    mesaElemento.addEventListener('click', function () {
      const idMesa = this.getAttribute('data-id');
      localStorage.setItem('mesaSeleccionada', idMesa);
      window.location.href = '/Comandero/html/menu.html';
    });
  } else if (estado == 2) {
   //Compatibilidad: naranja del API original, misma navegacion que 1
    mesaElemento.style.backgroundColor = "orange"; // Comanda pedida
    mesaElemento.addEventListener('click', function () {
      const idMesa = this.getAttribute('data-id');
      localStorage.setItem('mesaSeleccionada', idMesa);
      window.location.href = '/Comandero/html/menu.html';
    });
  } else if (estado == 3) {
   //Si el estado es 3, esta facturada/pagando: azul, sin acciones
    mesaElemento.style.backgroundColor = "blue"; // Facturada / pagando
  }
}
// funcion que actualiza el contador de clientes
async function actualizarContador(fecha){
  const data = await getComensalesMesa(fecha);
  let comensales = 0;
  data.mesas.forEach(mesa =>{
    comensales += mesa.numComensales;
    console.log("Num Mesa: "+mesa.numMesa + "-- comensales: " + mesa.numComensales);
  });
  document.getElementById("contador").textContent = comensales;
}
//Se consulta el estado de las mesas y se saca sus comensales
async function getComensalesMesa(fecha){
  try{
    const response = await fetch(`http://localhost:3000/GetMesasOcupadasFecha?fecha=${fecha}`);
    const data = await response.json();
    return data;
  }catch(e){
    console.error("Error al hacer la peticion: "+e);
  }
}
