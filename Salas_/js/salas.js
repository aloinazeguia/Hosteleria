import { actualizarEstado } from "./mesasEstado.js";
//Se importan los scripts del estado de las mesas

//Al cargar el DOM se ejecuta:
document.addEventListener('DOMContentLoaded', async () => {    
    //Se elimina el LocalStorage
    localStorage.clear();
    //inicializo el contador de clientes
    let cont  = 0;
    //funcion que consulta salas y genera mesas
    async function actualizarMesas() {
        //hace el llamado a la funcion que realiza el GET a salas
        const salasData = await getSalas();
        //guardo las salas
        //inicializo un contador para poder gestionar que sala se va a mostrar, segun el HTML
        let index = 0;
        //Si la ruta termina en sala2.html entonces index vale 1 sino 0 
        if (window.location.pathname.endsWith('sala2.html')) {
            index = 1;
        }
        //Se hace la llamada a la funcion que trae las mesas
        //Se le pasa el id de sala
        const mesasData = await getMesas(salasData.salas[index].idSala);
        //Con las mesas ya listas, se llama a la funcion que genera las mesas en el DOM
        generarMesas(mesasData);
        //Luego de generarlas se actualiza su estado mediante la funcion actualizarEstado()
        await actualizarEstado();
        console.log("actualizacion: "+(cont++));
    }

    // Se llama a la funcion para que muestre las mesas
    await actualizarMesas();
    // Actualiza las mesas ya creadas cada 5 segundos
    setInterval(actualizarEstado, 5000);
});

//funcion que genera mesa
const generarMesas = (mesas) => {
    //Se llama al contenedor
    const container = document.getElementById("plano");
    //Se itera con un map en el array de mesas que ha recibido
    //Se genera el HTML de button que representa cada mesa
    //Se le pasan los valores dinamicamente
    //Se le pasa el ID mediante un atributo personalizado
    const mesasHTML = mesas.mesas.map(item =>
        `<button class="mesa n${item.numMesa}" data-id="${item.numMesa}">${item.numMesa}</button>`
    ).join('');
    //Se inserta en el contenedor
    container.innerHTML = mesasHTML;
}
//funcion que hace la peticion GET a salas
async function getSalas() {
    const response = await fetch("http://localhost:3000/GetSalas");
    const data = await response.json();
    return data;
}
//funcion que hace la peticion GET a mesas
async function getMesas(idSala){
    const response = await fetch(`http://localhost:3000/GetMesas?idSala=${idSala}`);
    const data = await response.json();
    return data;
}
//Se llama al button para que te lleve a reserva
const btnRes = document.getElementById('reservar');
btnRes.addEventListener('click', function() {
    window.location.href = '../Reservas/html/indexsalas.html';
  
  })


