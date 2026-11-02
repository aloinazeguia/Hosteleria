# 📊 Análisis del Proyecto — Hostelería (CIFP Usurbil LHII)

> Documento de análisis técnico. Actualizado: 31/10/2026
> Objetivo del documento: dejar registrado **qué es este proyecto, cómo funciona,
> qué se ha construido encima y hacia dónde puede ir** (migración WPF).

---

## 1. Qué es el proyecto

Aplicación de gestión para un restaurante con tres módulos de negocio:

| Módulo | Función |
|---|---|
| 🪑 **Salas** | Plano de mesas con estados por color, refresco cada 5 s, contador de clientes |
| 📅 **Reservas** | Reserva web por fecha y nº de comensales, confirmación, listado y borrado |
| 🍽️ **Comandero** | Carta por categorías → subcategorías → productos, comandas, cobro, factura con IVA (10 %) y ticket imprimible |

Originalmente era una web (HTML + CSS + JS vanilla) que consumía una API externa
del centro (`apiostalaritza.lhusurbil.eus`). **Hoy esa API es propia**: vive en
`backend/` (Node.js + Express + MySQL) y la web le habla a `http://localhost:3000`.

```
┌─────────────────────────────┐         ┌──────────────────────────┐
│  Navegador                  │         │  MySQL (localhost:3306)  │
│  http://localhost:5173      │         │  BD: hosteleria          │
│  (serve / Live Server)      │         └────────────▲─────────────┘
│  HTML + CSS + JS vanilla    │                      │
│  └── fetch() ───────────────┼── HTTP JSON ──▶ API REST (localhost:3000)
└─────────────────────────────┘         Node.js + Express  (backend/)
```

**Puertos (no confundir):**
- `5173` → servidor de ficheros estáticos de la web (`npx serve`)
- `3000` → API REST (los `fetch()` del frontend apuntan aquí)
- `3306` → MySQL

---

## 2. Estructura del repositorio

```
Hosteleria/
├── index.html                  # Menú principal (Reservas / Comandas)
├── main.css
├── components/                 # Mini-librería de UI compartida
│   ├── AlertComponents.js/.css # AlertMessage, AlertConfirm (async)
│   └── readme.txt
├── Salas_/                     # Plano de salas / walk-in ( módulo "Comandas")
│   ├── sala1.html, sala2.html, info1.html
│   ├── css/, images/
│   └── js/ (salas.js, mesasEstado.js, info1.js)
├── Reservas/
│   ├── html/ (index, indexsalas, iconfirmacion, ListadoReservas, Reservado)
│   ├── css/, javascript/
│   └── Salas_/                 # Selección visual de mesa libre para reservar
├── Comandero/
│   ├── html/ (menu, comanda, cobrar, subtotal, factura, salas1, salas2)
│   ├── css/
│   └── js/ (menu, pedido, comanda, cobrar, subtotal, factura)
└── backend/                    # ⬅ NUEVO: API propia (Node + Express + MySQL)
    ├── package.json
    ├── .env / .env.example     # Credenciales MySQL + puerto
    ├── db/schema.sql           # BD + datos de ejemplo (npm run initdb)
    └── src/
        ├── server.js           # Express, CORS, monta routers
        ├── db.js               # Pool mysql2
        ├── initdb.js           # Ejecuta schema.sql
        └── routes/
            ├── salasMesas.js   # Salas, mesas, estados, libres/ocupadas
            ├── reservas.js     # PostReservar, GetReservasDia, DeleteReserva
            ├── carta.js        # Categorias/SubCategorias/Productos
            └── comandas.js     # Crear/abiertas/detalle/insertar/cobrar/cerrar
```

---

## 3. La base de datos (MySQL: `hosteleria`)

8 tablas, en cascada de negocio: `Salas → Mesas → (Reservas | Comandas → DetalleComanda)`
y la carta `Categorias → SubCategorias → Productos`.

| Tabla | Campos clave | Notas |
|---|---|---|
| `Salas` | idSala, nombre | La web usa índices 0/1 para sala1/sala2 |
| `Mesas` | **numMesa** (único global), idSala, capacidad | `numMesa` es el identificador visible en TODA la app |
| `Reservas` | fecha (DATE), idMesa, numComensales, datos cliente | Una reserva por mesa y día |
| `Categorias / SubCategorias` | id, nombre, idCategoria | Jerarquía de la carta |
| `Productos` | idSubCategoria, nombre, precio, numOrden | Precio DECIMAL → número JS |
| `Comandas` | idMesa, fecha, **estadoAbierta**, **cobrada**, **numComensales** | La máquina de estados de la mesa |
| `DetalleComanda` | idComanda, idProducto, cantidad | Líneas de pedido |

Datos de ejemplo incluidos en `schema.sql` (2 salas, 20 mesas, 21 productos).

---

## 4. Contrato de la API (lo que consume el frontend)

Todos los endpoints están en la raíz, tal cual los llamaba el API original.
**Regla de compatibilidad:** donde el original decía `idMesa` en la URL, aquí viaja
el `numMesa` visible; así el frontend no necesitó cambios de lógica.

### Consultas (GET)
| Endpoint | Devuelve | Consumido por |
|---|---|---|
| `GetSalas` | `{ salas: [{idSala, nombre}] }` | salas.js |
| `GetMesas?idSala=` | `{ mesas: [{idMesa, numMesa, capacidad}] }` | salas.js |
| `GetMesa?numMesa=` **(nuevo)** | `{ mesa: {…, capacidad} }` | info1.js (capacidad walk-in) |
| `GetEstadoMesas?fecha=` | `{ estados: [{idMesa, estado}] }` | mesasEstado.js |
| `GetMesasOcupadasFecha?fecha=` | `{ mesas: [{numMesa, numComensales}] }` | contador de clientes |
| `GetMesasLibresFecha?numComensales=&fecha=` | `{ mesas: [{numMesa}] }` | reserva (filtra por capacidad) |
| `GetReservasDia?fecha=` | `{ reservas: [{…cliente, numMesa…}] }` | listado y factura |
| `GetCategorias` | `{ categorias: [{id, nombre}] }` | menú |
| `GetSubCategorias?idCategoria=` | `{ categorias: […] }` ⚠️ array se llama "categorias" | menú |
| `GetProductos?idCategoria=` | `{ productos: [{id, nombre, precio}] }` ⚠️ aquí `idCategoria` = subcategoría | menú |
| `GetComandasMesaAbiertas?idMesa=` | `{ comandas: [{idComanda,…}] }` | menú/cobrar/factura |
| `GetDetalleComanda?idComanda=` | `{ detalleComandas: [{idProducto, nombre, precio, cantidad}] }` | ticket y cobro |

### Mutaciones
| Endpoint | Método | Notas |
|---|---|---|
| `PostReservar` | POST | Valida comensales > 0 y ≤ capacidad; 409 si mesa ya reservada ese día |
| `PostCrearComanda?idMesa=&numComensales=` | POST | Valida capacidad si llegan comensales (walk-in) |
| `PostInsertDetalleComanda` | POST | Espera un **array** de `{idComanda, idProducto, cantidad}` |
| `PutCobrarMesa?idMesa=` **(nuevo)** | PUT | Marca cobradas las comandas abiertas de hoy de la mesa |
| `PutCerrarComanda?idComanda=` | PUT | Cierra comanda (marca cobrada también) |
| `DeleteReserva?idreserva=` | DELETE | `{ok: true}` |

---

## 5. La máquina de estados de una mesa (núcleo del negocio)

Calculada por `GetEstadoMesas` **por fecha** (reservas y comandas son diarias):

```
        sin nada hoy          reserva de hoy          comanda abierta
             │        ┌────────────────────┐      ┌──────────────────────┐
             ▼        ▼                    ▼      ▼                      ▼
  🟢 VERDE (0) ──▶ 🔴 ROJA (1) ──────────▶ 🟢 SE SIENTA, COMANDA(abierta)
      │  ▲              │                          │
      │  │              └── clic ──▶ COMANDERO     │
      │  │              (clic = walk-in: comensales → comandero)
      │  │                                         │
      │  │   cobro (PutCobrarMesa)                 │
      │  │              ┌──────────────────────────┘
      │  ▼              ▼
      │  🔵 AZUL (3)  ◀─── pagando / factura pendiente de cerrar
      │  │
      │  │   finalizar factura (PutCerrarComanda + DeleteReserva si había)
      └──┘
```

| Estado | Color | Significado | Acción al clic |
|---|---|---|---|
| 0 | 🟢 verde | Libre (o ya cobrada y finalizada) | → pantalla de comensales (walk-in) |
| 1 | 🔴 rojo | Ocupada: comanda abierta o reserva de hoy | → comandero |
| 2 | 🟠 naranja | Legado del API original | mismo comportamiento que 1 |
| 3 | 🔵 azul | En cobro/factura (pagado, comanda aún abierta o cerrada sin cobrar) | sin acción |

Reutilizable: al cerrar la factura la mesa vuelve a VERDE y puede reservarse o
sentarse de nuevo el mismo día.

---

## 6. Dos flujos de negocio completos

### A) Reserva web (con reserva previa)
1. `Reservas/html/index` → fecha + personas → `GetMesasLibresFecha` (garantiza capacidad)
2. Selección visual de mesa libre (Reservas/Salas_) → `iconfirmacion` → datos del cliente
3. `PostReservar` → la mesa pasa a ROJA

### B) Walk-in (sin reserva, añadido hoy)
1. Plano de salas → clic en mesa **VERDE** → `Salas_/info1.html`
2. Muestra la **capacidad real** (`GetMesa`) y valida los comensales
3. → Comandero → pedido en `localStorage` → **Enviar**
4. `PostCrearComanda?numComensales=` (valida de nuevo) + `PostInsertDetalleComanda`
5. Mesa **ROJA** · al pagar (cobrar.js → `PutCobrarMesa`) mesa **AZUL**
6. Factura (imprimir/finalizar → `PutCerrarComanda` + borra reserva si había) → mesa **VERDE**

Ambos flujos comparten la regla: **nadie cabe donde no hay sitio** (validada
en el backend, avisada en la pantalla, y el contador de clientes no duplica).

---

## 7. Problemas corregidos (durante esta iteración)

| Problema | Dónde | Corrección |
|---|---|---|
| ❗ `comandasPendientes.aplice(...)` (typo de `splice`) | Comandero/js/comanda.js | ⚠️ **PENDIENTE** (bug original no tocado aún) |
| Mesa libre imposible de atender (no había walk-in) |Salas_/js/mesasEstado.js | Clic en verde → comensales → comandero |
| `Salas_/info1.html` invisible (comentario HTML sin cerrar) | Salas_/info1.html | Quitado `<!--` suelto |
| `Salas_/js/info1.js` no existía | Salas_/js/info1.js | Creado (comensales + capacidad + navega) |
| Rutas relativas rotas entre módulos (`../Comandero/...`) | mesasEstado.js | Rutas absolutas `/Comandero/html/menu.html` |
| `PostReservar` siempre decía "Éxito" | Reservas/.../iconfirmacion.js | Gestionar `{ok:false, error}` y mostrar ❌ |
| `comensalesMesa` persistente entre walk-ins | Comandero/js/menu.js | `removeItem` al enviar la comanda |
| Validación de comensales (reserva y walk-in) | backend + info1.js | Capacidad como regla de negocio |
| Contador contaba solo reservas | backend | Suma reservas + walk-ins sin duplicar |

---

## 8. Deuda técnica detectada (para más adelante)

1. **Duplicación de módulos**: `Salas_/` y `Reservas/Salas_/` son copias divergentes
   (la segunda es la "elección de mesa para reservar" y usa fecha de localStorage).
   Unificar o renombrar con intención.
2. `Sala1.html` vs `sala2.html`: salas fijas por fichero. Con datos dinámicos
   (`GetSalas`) debería ser una sola vista genérica.
3. Pagos "ficticios": cobrar.js no persiste método de pago ni importe (solo
   localStorage). Si se quiere caja/informes, hay que persistir el cobro.
4. El pedido antes de "Enviar" vive en `localStorage` (se pierde al cerrar).
   Migrarlo a DetalleComanda con estado "borrador" sería el paso natural.
5. No hay tests, ni gestión de errores global en frontend (alerts/console).
6. Sin git en el proyecto: **crear repositorio de verdad ASAP** (riesgo real).

---

## 9. Cómo se arranca todo (runbook)

```bash
# 1) MySQL
brew services start mysql                      # si no está arrancado

# 2) API (terminal 1) - carpeta backend
cd backend && npm install          # solo la primera vez
npm run initdb                     # solo la primera vez / para resetear datos
npm start                          # API en http://localhost:3000

# 3) Web (terminal 2) - carpeta raíz
npx serve -l 5173 .                # web en http://localhost:5173
```

Reset total de datos de prueba: `npm run initdb` (borra y recarga).

---

## 10. Horizonte: migración a WPF (aparcada, no olvidada)

El proyecto es un **banco de pruebas ideal** para la migración prevista:

- Lógica de negocio ya validada y estable (la API qué es lo que la app "era").
- Los modelos están claros: `Mesa`, `Reserva`, `Comanda`, `DetalleComanda`, `Producto`…
- La máquina de estados de mesa es la misma pieza que en WPF se transformará en
  `IValueConverter` + `DataTemplates` (colores por estado con `DataTrigger`).

Mapa de migración previsto (cuando toque):

| Ahora (web) | Después (WPF + MVVM) |
|---|---|
| `fetch()` en cada `.js` | `MesasApiService` con `HttpClient` + DI |
| Botones de mesa + colores | `ItemsControl` + `DataTrigger`/`IValueConverter` |
| `addEventListener('click')` | `RelayCommand` en ViewModels |
| `localStorage` | Repositorio (SQLite/JSON) y DTOs tipados |
| Pantallas duplicadas por sala | Una vista data-driven (`ItemsControl` por sala) |
| `alert()` del navegador | `DialogService` propio |

**Ventaja clave del camino recorrido:** al tener la API local y el contrato
documentado en este archivo, la futura app WPF puede consumir **exactamente la
misma API** (e incluso reutilizar los mismos endpoints) mientras se va migrando
pantalla por pantalla sin big-bang.

---

*Documento creado como parte de la función de "analista de desarrollo del proyecto".
Toda decisión fuerte de diseño (estados de mesa, validaciones, walk-in) queda
reflejada aquí para que el futuro "tú" (o el futuro WPF) no tenga que
re-inventarla.*
