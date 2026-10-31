import { AlertMessage } from "../../components/AlertComponents.js";
import { AlertConfirm } from "../../components/AlertComponents.js";

// Variable global para guardar el pedido actual
let pedidoActual = [];

document.addEventListener('DOMContentLoaded', () => {
    //document.getElementById("boton-tarjeta").addEventListener('click',  PagoTarjeta);
    //document.getElementById("boton-efectivo").addEventListener('click', () => PagoEfectivo(pedidoActual));
    document.getElementById("boton-tarjeta").addEventListener('click', async () => {
    localStorage.setItem("formaPago", "Pago con Tarjeta");
    await marcarCobrada();  // mesa pasa a AZUL mientras se hace la factura
    PagoTarjeta();  // Llamada a la función
    AlertMessage("La operación se ha realizado con éxito", "factura.html");
});

document.getElementById("boton-efectivo").addEventListener('click', () => {
    localStorage.setItem("formaPago", "Pago en Efectivo");
    PagoEfectivo(pedidoActual);  // Llamada a la función con pedidoActual
    AlertMessage("La operación se ha realizado con éxito", "factura.html");
});
    document.getElementById("boton-cancelar").addEventListener('click', async () => { cancelarPago() });

    mostrarPedidoEnCobrar();
});

async function mostrarPedidoEnCobrar() {
    const lista = document.getElementById('listaCobro');
    lista.innerHTML = '';

    const mesaId = localStorage.getItem('mesaSeleccionada');
    if (!mesaId) {
        lista.innerHTML = '<li>No hay mesa seleccionada.</li>';
        return;
    }

    // Obtener productos de la comanda
    let pedidoGuardado = [];

    // 1. Recuperar productos de la API (comandas abiertas)
    const resComandas = await fetch(`http://localhost:3000/GetComandasMesaAbiertas?idMesa=${mesaId}`);
    const dataComandas = await resComandas.json();
    const comandas = Array.isArray(dataComandas.comandas) ? dataComandas.comandas : [];

    for (const comanda of comandas) {
        const idComanda = comanda.idComanda;
        if (!idComanda) continue;
        const detalleRes = await fetch(`http://localhost:3000/GetDetalleComanda?idComanda=${idComanda}`);
        const detalleData = await detalleRes.json();
        if (detalleData.detalleComandas && Array.isArray(detalleData.detalleComandas)) {
            pedidoGuardado = pedidoGuardado.concat(detalleData.detalleComandas);
        }
    }

    // 2. Recuperar productos del localStorage (productos no enviados)
    const pedidoLocal = localStorage.getItem(`pedido_mesa_${mesaId}`);
    if (pedidoLocal) {
        try {
            const productosLocales = JSON.parse(pedidoLocal);
            if (Array.isArray(productosLocales)) {
                // Fusionamos los productos de la API con los productos del localStorage
                pedidoGuardado = pedidoGuardado.concat(productosLocales);
            }
        } catch (e) {
            console.error("Error al parsear productos locales:", e);
        }
    }

    if (!pedidoGuardado || pedidoGuardado.length === 0) {
        lista.innerHTML = '<li>No hay productos en el pedido.</li>';
        return;
    }

    // Guardar el pedido actual en la variable global
    pedidoActual = pedidoGuardado;

    pedidoGuardado.forEach(item => {
        const li = document.createElement('li');
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        li.textContent = `${item.nombre} x${item.cantidad} - ${subtotal}€`;
        lista.appendChild(li);
    });

    mostrarTotalEnCobrar(pedidoGuardado);
}

function mostrarTotalEnCobrar(pedido) {
    const totalSpan = document.getElementById('totalCobro');
    let total = 0;

    if (pedido && Array.isArray(pedido)) {
        total = pedido.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    }

    totalSpan.textContent = total.toFixed(2);
}

async function cancelarPago() {
    let message = "¿Estás seguro de cancelar la operación?";
    if (await AlertConfirm(message)) {
        const mesaId = localStorage.getItem('mesaSeleccionada');
        localStorage.removeItem(`pedido_mesa_${mesaId}`);

        window.location.href = './menu.html';
    } else {
        AlertMessage("Operación cancelada");
    }
}

async function PagoTarjeta() {
    
    let message = "La operación se ha realizado con éxito";
    let redirection = 'factura.html';
    AlertMessage(message, redirection);
}

async function PagoEfectivo(pedido) {

    if (!pedido || !Array.isArray(pedido) || pedido.length === 0) {
        AlertMessage("No hay productos cargados para cobrar.");
        return;
    }

    let total = pedido.reduce((sum, item) => {
        const precio = Number(item.precio) || 0;
        const cantidad = Number(item.cantidad) || 0;
        return sum + precio * cantidad;
    }, 0);

    let recibido = parseFloat(prompt('Ingrese la cantidad recibida:'));
    if (isNaN(recibido)) {
        AlertMessage("Por favor, ingrese una cantidad válida.");
        return;
    }

    // Redondeo para evitar problemas de decimales
    let cambio = Math.round((recibido - total) * 100) / 100;

    let message = "";
    let redirection = "";

    if (cambio === 0) {
        localStorage.setItem("formaPago","Pago en efectivo");
        await marcarCobrada();  // mesa pasa a AZUL mientras se hace la factura
        message = 'Pago realizado con éxito. Importe Exacto';
        redirection = 'factura.html';


        AlertMessage(message, redirection);
    } else if (cambio > 0) {
        localStorage.setItem("formaPago","Pago en efectivo");
        await marcarCobrada();  // mesa pasa a AZUL mientras se hace la factura
        message = `Pago realizado con éxito. Su cambio es: €${cambio.toFixed(2)}`;
        redirection = 'factura.html';


        AlertMessage(message, redirection);
    } else {
        message = 'El importe recibido es insuficiente.';
        AlertMessage(message);
    }
}



// Marca la mesa como cobrada en el backend:
// comanda abierta + cobrada = mesa en AZUL hasta cerrar la factura
async function marcarCobrada() {
    const mesaId = localStorage.getItem('mesaSeleccionada');
    if (!mesaId) return;
    try {
        await fetch(`http://localhost:3000/PutCobrarMesa?idMesa=${mesaId}`, { method: 'PUT' });
    } catch (e) {
        console.warn('No se pudo marcar la mesa como cobrada:', e);
    }
}
