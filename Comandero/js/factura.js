import { AlertMessage } from "../../components/AlertComponents.js";

let pedidoActual = [];

document.addEventListener('DOMContentLoaded', () => {
    mostrarPedidoDesdeAPI();
    mostrarFechaYHora();
    mostrarInfoExtra();
    document.getElementById("boton-imprimir").addEventListener("click", imprimirTicket);
    document.getElementById("boton-finalizar").addEventListener("click", finalizarSinImprimir);
});

async function mostrarPedidoDesdeAPI() {
    const lista = document.getElementById('listaCobro');
    lista.innerHTML = '';

    const mesaId = localStorage.getItem('mesaSeleccionada');
    if (!mesaId) {
        lista.innerHTML = '<li>No hay mesa seleccionada.</li>';
        return;
    }

    // Obtener productos desde API
    let pedido = [];
    const resComandas = await fetch(`http://localhost:3000/GetComandasMesaAbiertas?idMesa=${mesaId}`);
    const dataComandas = await resComandas.json();
    const comandas = Array.isArray(dataComandas.comandas) ? dataComandas.comandas : [];

    for (const comanda of comandas) {
        const idComanda = comanda.idComanda;
        if (!idComanda) continue;
        const detalleRes = await fetch(`http://localhost:3000/GetDetalleComanda?idComanda=${idComanda}`);
        const detalleData = await detalleRes.json();
        if (detalleData.detalleComandas && Array.isArray(detalleData.detalleComandas)) {
            pedido = pedido.concat(detalleData.detalleComandas);
        }
    }

    if (pedido.length === 0) {
        lista.innerHTML = '<li>No hay productos en el pedido.</li>';
        return;
    }

    pedidoActual = pedido;

    pedido.forEach(item => {
        const li = document.createElement('li');
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        li.textContent = `${item.nombre} x${item.cantidad} - ${subtotal}€`;
        lista.appendChild(li);
    });

    mostrarTotalEnCobrar(pedido);
    generarQR();
}

function mostrarTotalEnCobrar(pedido) {
    const totalSpan = document.getElementById('total');
    const total = pedido.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    totalSpan.textContent = total.toFixed(2);

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
    const formato = ahora.toLocaleString('es-ES');
    document.getElementById('fecha-hora').textContent = formato;
}

function mostrarInfoExtra() {
    const salaMesa = localStorage.getItem('mesaSeleccionada') || '';
    const formaPago = localStorage.getItem('formaPago') || 'Pago en efectivo';
    document.getElementById('sala-mesa').textContent = "Mesa: "+salaMesa;
    document.getElementById('forma-pago').textContent = formaPago;
}

function generarQR() {
    const total = document.getElementById('total').textContent;
    const textoQR = `Total factura: ${total} €`;
    const urlQR = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(textoQR)}&size=150x150`;

    const contenedorQR = document.getElementById('contenedorQR');
    contenedorQR.innerHTML = '';
    const imgQR = document.createElement('img');
    imgQR.src = urlQR;
    imgQR.alt = 'Código QR del total';
    contenedorQR.appendChild(imgQR);
}

async function imprimirTicket() {
    const ticket = document.getElementById('ticket');
    const ventanaImpresion = window.open('', '', 'width=600,height=400');
    ventanaImpresion.document.write('<html><head><title>Ticket de compra</title></head><body>');
    ventanaImpresion.document.write(ticket.innerHTML);
    ventanaImpresion.document.write('<style>body{font-family: Arial, sans-serif;}</style>');
    ventanaImpresion.document.close();
    ventanaImpresion.print();
    ventanaImpresion.close();

    const mesaId = localStorage.getItem('mesaSeleccionada');
    if (mesaId) {
        await cerrarComandasYEliminarReserva(mesaId);
    }

    AlertMessage('El ticket se ha impreso correctamente', '../../Salas_/sala1.html');
}

async function finalizarSinImprimir() {
    const mesaId = localStorage.getItem('mesaSeleccionada');
    if (mesaId) {
        await cerrarComandasYEliminarReserva(mesaId);
    }
    AlertMessage('Operación finalizada sin imprimir', '../../Salas_/sala1.html');
}

async function cerrarComandasYEliminarReserva(mesaId) {
    try {
        // 1. CERRAR TODAS LAS COMANDAS DE ESA MESA
        const resComandas = await fetch(`http://localhost:3000/GetComandasMesaAbiertas?idMesa=${mesaId}`);
        const dataComandas = await resComandas.json();
        const comandas = Array.isArray(dataComandas.comandas) ? dataComandas.comandas : [];

        for (const comanda of comandas) {
            const idComanda = comanda.idComanda;
            if (!idComanda) continue;

            const res = await fetch(`http://localhost:3000/PutCerrarComanda?idComanda=${idComanda}`, {
                method: 'PUT'
            });

            if (!res.ok) {
                console.warn(`No se pudo cerrar la comanda ${idComanda}`);
            }
        }

        // 2. ELIMINAR LA RESERVA DE ESA MESA (si existe) PARA HOY
        const hoy = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const resReservas = await fetch(`http://localhost:3000/GetReservasDia?fecha=${hoy}`);
        const dataReservas = await resReservas.json();
        const reservas = Array.isArray(dataReservas.reservas) ? dataReservas.reservas : [];

        const reservaMesa = reservas.find(r => r.numMesa == mesaId);
        if (reservaMesa && reservaMesa.idReserva) {
            const resDelete = await fetch(`http://localhost:3000/DeleteReserva?idreserva=${reservaMesa.idReserva}`, {
                method: 'DELETE'
            });

            if (!resDelete.ok) {
                console.warn(`Error al eliminar reserva ${reservaMesa.idReserva}`);
            } 
        }

    } catch (error) {
        console.error("Error cerrando comandas y/o eliminando reserva:", error);
    }
}
