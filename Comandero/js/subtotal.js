import { AlertMessage } from "../../components/AlertComponents.js";

let pedidoActual = [];

document.addEventListener('DOMContentLoaded', () => {
    mostrarPedidoEnFactura();
    mostrarFechaYHora();
    mostrarInfoExtra();

    document.getElementById("boton-imprimir").addEventListener("click", imprimirSub);
});

async function mostrarPedidoEnFactura() {
    const lista = document.getElementById('listaCobro');
    lista.innerHTML = ''; // Limpiar la lista antes de añadir nuevos elementos

    const mesaId = localStorage.getItem('mesaSeleccionada');
    if (!mesaId) {
        lista.innerHTML = '<li>No hay mesa seleccionada.</li>';
        return;
    }

    let pedidoGuardado = [];
    try {
        const resComandas = await fetch(`http://localhost:3000/GetComandasMesaAbiertas?idMesa=${mesaId}`);
        const dataComandas = await resComandas.json();
        const comandas = Array.isArray(dataComandas.comandas) ? dataComandas.comandas : [];

        // Recoger los detalles de cada comanda
        for (const comanda of comandas) {
            const idComanda = comanda.idComanda;
            if (!idComanda) continue;
            const detalleRes = await fetch(`http://localhost:3000/GetDetalleComanda?idComanda=${idComanda}`);
            const detalleData = await detalleRes.json();
            if (detalleData.detalleComandas && Array.isArray(detalleData.detalleComandas)) {
                pedidoGuardado = pedidoGuardado.concat(detalleData.detalleComandas);
            }
        }
    } catch (error) {
        console.error("Error al recuperar las comandas:", error);
        lista.innerHTML = '<li>Error al cargar el pedido.</li>';
        return;
    }

    // Si no hay productos en el pedido
    if (!pedidoGuardado || pedidoGuardado.length === 0) {
        lista.innerHTML = '<li>No hay productos en el pedido.</li>';
        return;
    }

    pedidoActual = pedidoGuardado;

    // Mostrar los productos en la lista de la factura
    pedidoGuardado.forEach(item => {
        const li = document.createElement('li');
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        li.textContent = `${item.nombre} x${item.cantidad} - ${subtotal}€`;
        lista.appendChild(li);
    });

    mostrarTotales(pedidoGuardado);
}

function mostrarTotales(pedido) {
    const totalSpan = document.getElementById('total');
    let total = pedido.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    totalSpan.textContent = total.toFixed(2);

    // Llamadas a las funciones de cálculo de totales
    calcularBase(total);
    calcularCuota(total);
    // calcularMediaxComensal(total);
}

function calcularBase(total) {
    const base = total / 1.10;
    document.getElementById('base-iva').textContent = base.toFixed(2);
}

function calcularCuota(total) {
    const cuota = total * 0.10;
    document.getElementById('cuota-iva').textContent = cuota.toFixed(2);
}

// function calcularMediaxComensal(total) {
//     const numComensales = parseInt(localStorage.getItem('numComensales'), 10) || 1;
//     document.getElementById('comensales').textContent = numComensales;
//     const media = total / numComensales;
//     document.getElementById('mediaxComensal').textContent = media.toFixed(2);
// }

function mostrarFechaYHora() {
    const ahora = new Date();
    const formato = ahora.toLocaleString();
    document.getElementById('fecha-hora').textContent = `Fecha y hora: ${formato}`;
}

function mostrarInfoExtra() {
    const salaMesa = localStorage.getItem('salaMesa') || '';
    const formaPago = localStorage.getItem('formaPago') || '';
    document.getElementById('sala-mesa').textContent = `Sala/Mesa: ${salaMesa}`;
    document.getElementById('forma-pago').textContent = `Forma de pago: ${formaPago}`;
}

export function imprimirSub() {
    const ticket = document.getElementById('ticket');
    const ventanaImpresion = window.open('', '', 'width=600,height=400');
    ventanaImpresion.document.write('<html><head><title>Ticket de compra</title></head><body>');
    ventanaImpresion.document.write(ticket.innerHTML);
    ventanaImpresion.document.write('<style>body{font-family: Arial, sans-serif;}</style>');
    ventanaImpresion.document.close();
    ventanaImpresion.print();
    
    // Cerrar la ventana de impresión después de un segundo (tiempo suficiente para imprimir)
    setTimeout(() => {
        ventanaImpresion.close();
    }, 1000);

    // Mensaje de confirmación y redirección
    let message = 'El ticket se ha imprimido correctamente.';
    let redirection = "../../Salas_/sala1.html";
    AlertMessage(message, redirection);
}
