import { agregarProductoAlPedido, handlerProductos } from "./pedido.js";
import { AlertMessage } from "../../components/AlertComponents.js";

document.addEventListener('DOMContentLoaded', async () => {
    let message = '';
    let redirection = '';
    // meter manualmente la mesa
    
    const mesa = localStorage.getItem("mesaSeleccionada");
    const hora = new Date().toLocaleTimeString();
    const fecha = new Date().toLocaleDateString();
    // Guardar datos de la mesa en el local storage
    localStorage.setItem('datosMesa', JSON.stringify({ mesa, hora, fecha }));




    const datosMesa = JSON.parse(localStorage.getItem('datosMesa'));


    if (!datosMesa) {
        message = 'No se han encontrado datos de la mesa. Por favor, vuelve a la página anterior.';
        redirection = "../../Salas_/sala1.html";
        AlertMessage(message,redirection);
    }
 
    const categoriasJson = await fetchCategorias();

    if (categoriasJson.categorias.length > 0) {
        const primeraId = categoriasJson.categorias[0].id;

        const subcategoriasJson = await fetchSubCategorias(primeraId);
        
        //mostrar lista de categorias al cargar
        mostrarCategorias(categoriasJson.categorias);
        mostrarSubCategorias(subcategoriasJson.categorias);
    }
    // Event listener de categorias para que muestren Subcategorias
    document.querySelectorAll('#containerCategorias li').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = e.currentTarget.dataset.categoria;

            // Llamamos a fetchSubCategorias con el id de la categoría seleccionada
            const subcategorias = await fetchSubCategorias(id);
            mostrarSubCategorias(subcategorias.categorias);
        });
    });

    const btnEnviar = document.getElementById('boton-esperar');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', async () => {
            const mesaId = localStorage.getItem('mesaSeleccionada');
            

            if (!mesaId) {
               message = 'No se ha seleccionado ninguna mesa.';
               redirection = "../../Salas_/sala1.html";
               AlertMessage(message,redirection);
                    return;
            }

            const pedidoGuardado = localStorage.getItem(`pedido_mesa_${mesaId}`);
     

            if (!pedidoGuardado) {
            message = 'No hay productos en el pedido.';
            AlertMessage(message);
            return;
            }
            const pedido = JSON.parse(pedidoGuardado);


            // 1. Obtener comandas abiertas
           
            const comandasAbiertas = await obtenerComandasAbiertas(mesaId);


            let lista = Array.isArray(comandasAbiertas.comandas)
                ? comandasAbiertas.comandas
                : [];

            let idComanda = null;

            if (lista.length > 0) {
                // Ya hay comanda abierta, usa la última
                const comandaReciente = lista[lista.length - 1];

                idComanda =
                    comandaReciente.idComanda ||
                    comandaReciente.Idcomanda ||
                    comandaReciente.id ||
                    comandaReciente.comandaId ||
                    null;
                if (!idComanda) {
                    for (const key in comandaReciente) {
                        if (
                            typeof comandaReciente[key] === 'number' &&
                            comandaReciente[key] > 0
                        ) {
                            idComanda = comandaReciente[key];
                            break;
                        }
                    }
                }
            } else {
                // No hay comanda abierta, crea una nueva

                await crearComanda(mesaId);
                document.getElementById("boton-esperar").textContent = "Cargando...";
                await new Promise(resolve =>setTimeout(resolve, 500));
                
                const comandasAbiertas = await obtenerComandasAbiertas(mesaId);


                let lista = Array.isArray(comandasAbiertas.comandas)
                ? comandasAbiertas.comandas
                : [];
                // Ya hay comanda abierta, usa la última
                const comandaReciente = lista[lista.length - 1];

                idComanda =
                    comandaReciente.idComanda ||
                    comandaReciente.Idcomanda ||
                    comandaReciente.id ||
                    comandaReciente.comandaId ||
                    null;
            }
            document.getElementById("boton-esperar").textContent = "Enviar";


            if (!idComanda) {
               message = 'No se pudo obtener el id de la comanda.';
               AlertMessage(message);
               return;
            }
            localStorage.setItem('idComanda', idComanda);

            // --- Obtener productos ya enviados ---

            let productosEnviados = [];
            for (const comanda of lista) {
                const idCom = comanda.idComanda;
                if (!idCom) continue;
                const detalleRes = await fetch(`http://localhost:3000/GetDetalleComanda?idComanda=${idCom}`);
                const detalleData = await detalleRes.json();

                if (detalleData.detalleComandas && Array.isArray(detalleData.detalleComandas)) {
                    productosEnviados = productosEnviados.concat(
                        detalleData.detalleComandas.map(d => d.idProducto)
                    );
                }
            }


            // --- Filtrar solo los productos válidos ---
            const detalles = pedido
                .filter(producto => {
                    const id = Number(producto.id);
                    const cantidad = Number(producto.cantidad);
                    // Solo agrega si id y cantidad son válidos y positivos
                    return (
                        !isNaN(id) &&
                        !isNaN(cantidad) &&
                        id > 0 &&
                        cantidad > 0
                    );
                })
                .map(producto => ({
                    idComanda: Number(idComanda),
                    idProducto: Number(producto.id),
                    cantidad: Number(producto.cantidad)
                }));



            if (detalles.length === 0) {
               message = 'No hay productos nuevos para enviar.';
               AlertMessage(message);
               return;
            }

            const urlDetalle = `http://localhost:3000/PostInsertDetalleComanda`;
            const resDetalle = await fetch(urlDetalle, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(detalles)
            });

            let dataDetalle = null;
            const textDetalle = await resDetalle.text();
            try {
                dataDetalle = textDetalle ? JSON.parse(textDetalle) : {};
            } catch (e) {
                console.error('Respuesta no es JSON válido:', textDetalle);
                dataDetalle = {};
            }


            if (!resDetalle.ok || dataDetalle.ok === false) {
                message = 'Error al insertar detalle de comanda: ' + (dataDetalle.status || '');
                AlertMessage(message);
                return;
            }

                message = 'Comanda enviada correctamente';
                redirection = '../../Salas_/sala1.html';
                AlertMessage(message, redirection);
            // Limpia el pedido y vuelve a la sala
            localStorage.removeItem(`pedido_mesa_${mesaId}`);
            localStorage.removeItem('comensalesMesa');
            
        });
    }

    await pintarPedidoUlConEstado();
});

// Funciones que realizan fetch de tipo GET

async function fetchCategorias() {
    try {
        const res = await fetch('http://localhost:3000/GetCategorias');
        return await res.json();
    } catch (e) {
        console.error('Error cargando categorías');
        return [];
    }
}

// Cambié la URL para incluir el parametro categoria_id
async function fetchSubCategorias(idCategoria) {
    try {
        // Aquí se ajusta la URL para cada categoria_id
        const res = await fetch(`http://localhost:3000/GetSubCategorias?idCategoria=${idCategoria}`);
        return await res.json();
    } catch (e) {
        console.error('Error cargando subcategorías');
        return [];
    }
}

async function fetchProductos(idSubCategoria) {
    try {
        // Cambié el parámetro de URL para obtener productos según subcategoría
        const res = await fetch(`http://localhost:3000/GetProductos?idCategoria=${idSubCategoria}`);
        return await res.json();
    } catch (e) {
        console.error('Error cargando productos');
        return [];
    }
}

//GENERADORES, PARA QUE SEA DINAMICO

//GENERA LA LISTA DE CATEGORIAS
function mostrarCategorias(categorias) {
    const container = document.getElementById("containerCategorias");
    const categoriasHTML = categorias.map(cat => {
        return `
            <li href="#" data-categoria="${cat.id}">${cat.nombre}</li>
        `;
    }).join('');
    container.innerHTML = categoriasHTML;
}

//GENERADORES PARA LISTAR PRODUCTOS

// Funciones para mostrar los resultados en el DOM
function mostrarSubCategorias(subcategorias) {
    const container = document.getElementById('containerListadoDatos');
    container.innerHTML = ''; // Limpiar resultados previos

    if (subcategorias.length === 0) {
        container.innerHTML = 'No se encontraron subcategorías.';
        return;
    }
    const containerHTML = subcategorias.map(subcategoria => {
        return `
            <div class="subCategoria" data-subcategoria="${subcategoria.id}">
                <img src="https://www.euskoguide.com/images/san-sebastian/san-sebastian-pintxos.jpg" alt="${subcategoria.nombre}"/>
                <span>${subcategoria.nombre}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = containerHTML;


    // Event listener de Subcategorias para que muestren productos
    Array.from(document.getElementsByClassName('subCategoria')).forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = e.currentTarget.dataset.subcategoria;

            // Llamamos a fetchSubCategorias con el id de la categoría seleccionada
            const productosJson = await fetchProductos(id);

            mostrarProductos(productosJson.productos);
        });
    });

}

let productosGlobal = []; // Esto se llena cuando llamas a fetchProductos

function mostrarProductos(productos) {
    productosGlobal = productos; // <-- Añade esto
    const container = document.getElementById('containerListadoDatos');
    container.innerHTML = '';

    if (productos.length === 0) {
        container.innerHTML = 'No se encontraron productos.';
        return;
    }
    const containerHTML = productos.map(producto => {
        const precioFloat = parseFloat(producto.precio);
        return `
            <div class="productos" data-producto="${producto.id}" data-precio="${precioFloat}" data-numorden="${producto.numOrden || 1}">
                <p>${producto.nombre}</p>
                <span>${precioFloat.toFixed(2)}€</span>
            </div>
        `;
    }).join('');

    container.innerHTML = containerHTML;
    handlerProductos();
}

// Función para crear la comanda
// Incluye los comensales del walk-in (localStorage) si existen: el backend
// los valida contra la capacidad de la mesa
async function crearComanda(idMesa) {
    const comensales = localStorage.getItem('comensalesMesa');
    const extra = comensales ? `&numComensales=${encodeURIComponent(comensales)}` : '';
    const url = `http://localhost:3000/PostCrearComanda?idMesa=${idMesa}${extra}`;
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();

    if (!res.ok || data.ok === false) {
        AlertMessage('Error al crear la comanda: ' + (data.error || res.status));
    }

    return data;
}

// Función para obtener comandas abiertas de una mesa
async function obtenerComandasAbiertas(idMesa) {
    const url = `http://localhost:3000/GetComandasMesaAbiertas?idMesa=${idMesa}`;
    const res = await fetch(url);
    const data = await res.json();

    return data;
}

// Función para insertar un detalle de comanda
async function insertarDetalleComanda(idComanda, producto) {
    const urlDetalle = `http://localhost:3000/PostInsertDetalleComanda`;
    const comanda = [{
        idComanda: Number(idComanda),
        idProducto: Number(producto.id),
        cantidad: Number(producto.cantidad)
    }];

    const resDetalle = await fetch(urlDetalle, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(comanda)
    });

    let dataDetalle = null;
    const textDetalle = await resDetalle.text();
    try {
        dataDetalle = textDetalle ? JSON.parse(textDetalle) : {};
    } catch (e) {
        console.error('Respuesta no es JSON válido:', textDetalle);
        dataDetalle = {};
    }


    if (!resDetalle.ok || dataDetalle.ok === false) {
       let message = 'Error al insertar detalle de comanda: ' + (dataDetalle.status || '');
        AlertMessage(message);
        return false;
    }
    return true;
}

export async function pintarPedidoUlConEstado() {
    const mesaId = localStorage.getItem('mesaSeleccionada');
    if (!mesaId) return;

    const lista = document.querySelector('.pedido-ul');
    if (!lista) return;
    lista.innerHTML = '';

    // 1. Obtener comandas abiertas
    const comandasData = await obtenerComandasAbiertas(mesaId);
    const comandas = Array.isArray(comandasData.comandas) ? comandasData.comandas : [];

    // 2. Obtener productos enviados
    let productosEnviados = [];
    for (const comanda of comandas) {
        const idComanda = comanda.idComanda;
        if (!idComanda) continue;

        try {
            const res = await fetch(`http://localhost:3000/GetDetalleComanda?idComanda=${idComanda}`);
            const data = await res.json();
            if (Array.isArray(data.detalleComandas)) {
                productosEnviados = productosEnviados.concat(data.detalleComandas);
            }
        } catch (error) {
            console.error(`Error obteniendo detalle de comanda ${idComanda}:`, error);
        }
    }

    // 3. Agrupar productos enviados por idProducto y calcular totalEnviados
    let totalEnviados = 0;
    const enviadosAgrupados = {};
    productosEnviados.forEach(prod => {
        const id = Number(prod.idProducto);
        if (!id) return;

        // Busca el precio en productosGlobal si no viene en la API
        let precioFloat = parseFloat(prod.precio);
        if (!precioFloat || isNaN(precioFloat)) {
            const productoLocal = productosGlobal.find(p => Number(p.id) === id);
            precioFloat = productoLocal ? parseFloat(productoLocal.precio) : 0;
        }

        if (!enviadosAgrupados[id]) {
            enviadosAgrupados[id] = {
                nombre: prod.nombre || (productoLocal ? productoLocal.nombre : 'Producto'),
                cantidad: Number(prod.cantidad) || 0,
                precio: precioFloat
            };
        } else {
            enviadosAgrupados[id].cantidad += Number(prod.cantidad) || 0;
        }
    });

    // 4. Mostrar productos enviados (verde) y sumar su total
    for (const [id, prod] of Object.entries(enviadosAgrupados)) {
        const cantidad = prod.cantidad;
        const precio = parseFloat(prod.precio) || 0;
        const li = document.createElement('li');
        li.textContent = `${prod.nombre} x${cantidad} - ${(precio * cantidad).toFixed(2)}€`;
        li.classList.add('producto-enviado');
        lista.appendChild(li);
        totalEnviados += cantidad * precio;
    }

    // Guarda el total de enviados en una variable global
    window.totalEnviadosComanda = totalEnviados;

    // 5. Mostrar productos pendientes del pedido actual (naranja) y sumar su total
    const pedidoGuardado = localStorage.getItem(`pedido_mesa_${mesaId}`);
    const pedido = pedidoGuardado ? JSON.parse(pedidoGuardado) : [];

    const idsEnviados = Object.keys(enviadosAgrupados).map(id => Number(id));

    let totalPendientes = 0;
    pedido.forEach(prod => {
        const id = Number(prod.id);
        const cantidad = Number(prod.cantidad);
        const precio = parseFloat(prod.precio) || 0;

        if (idsEnviados.includes(id)) return;
        if (!id || isNaN(cantidad) || isNaN(precio) || cantidad <= 0) return;

        
        agregarProductoAlPedido(prod.nombre,prod.precio,prod.cantidad,prod.id,1,false)
        totalPendientes += cantidad * precio;
    });
    

    // 6. Mostrar total de toda la comanda (enviados + pendientes)
    const totalComanda = totalEnviados + totalPendientes;
    const totalSpan = document.querySelector('.total span');
    if (totalSpan) {
        totalSpan.textContent = `${totalComanda.toFixed(2)}€`;
    }
}

if (!window.domReadyListenerAdded) {
  document.addEventListener("DOMContentLoaded", () => {

  });
  window.domReadyListenerAdded = true;
}
