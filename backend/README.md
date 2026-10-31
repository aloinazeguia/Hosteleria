# Backend propio (API + MySQL)

Sustituye al API `apiostalaritza.lhusurbil.eus` en local. Los endpoints son
idénticos (mismas rutas, mismos parámetros y mismas formas de respuesta), así
que la web funciona sin tocar su lógica: solo hay que cambiar la URL base.

## Puesta en marcha

```bash
cd backend
npm install            # express, mysql2, cors y dotenv
cp .env.example .env   # y edita DB_USER / DB_PASSWORD con tu MySQL
npm run initdb         # crea la BD "hosteleria", tablas y datos de ejemplo
npm start              # API en http://localhost:3000
# o npm run dev        # reinicia solo al guardar cambios
```

## Cambiar la web para usar tu API

En los `.js` del frontend busca y reemplaza una sola cadena (sustitución
global):

```
https://apiostalaritza.lhusurbil.eus  ->  http://localhost:3000
```

## Cómo funcionaba todo (recordatorio del negocio)

1. **Reserva web**: formulario → `GetMesasLibresFecha` (mesas con capacidad
   suficiente, sin reserva ni comanda abierta ese día) → `PostReservar`
   guarda la reserva con los datos del cliente.
2. **Estado de mesas** (verde/rojo/naranja/azul): `GetEstadoMesas` calcula
   por cada mesa del día:
   - comanda **abierta** hoy → 2 (naranja)
   - **reserva** hoy → 1 (roja)
   - comanda **cerrada** hoy → 3 (azul)
   - si no → 0 (libre, verde).
   `GetMesasOcupadasFecha` solo suma comensales para el contador.
3. **Comandero**: al enviar el pedido, si la mesa no tiene comanda abierta
   se crea con `PostCrearComanda`; después `PostInsertDetalleComanda`
   inserta las líneas (llega un *array* de `{idComanda, idProducto, cantidad}`)
   y `GetDetalleComanda` repinta enviados (verde) frente a pendientes.
4. **Facturar**: `PutCerrarComanda` cierra cada comanda abierta de la mesa y,
   si tenía reserva hoy, `DeleteReserva` la elimina → la mesa vuelve a libre.

## Estructura

```
backend/
├── db/schema.sql            # tablas + datos de ejemplo
├── src/
│   ├── server.js            # express + montaje de rutas + CORS
│   ├── initdb.js            # ejecuta schema.sql (npm run initdb)
│   ├── db.js                # pool mysql2 (lee .env)
│   └── routes/
│       ├── salasMesas.js    # GetSalas, GetMesas, estados, libres/ocupadas
│       ├── reservas.js      # PostReservar, GetReservasDia, DeleteReserva
│       ├── carta.js         # GetCategorias, GetSubCategorias, GetProductos
│       └── comandas.js      # crear/abiertas/detalle/insertar/cerrar
```

## Notas de diseño (compatibilidad con el frontend)

- La web usa `numMesa` como identificador visible de mesa y el original
  llamaba `idMesa` a algunos parámetros. Aquí los endpoints devuelven y
  aceptan `numMesa` en el campo `idMesa` para ser 100 % compatibles.
- `GetEstadoMesas` prioriza: comanda abierta > reserva > comanda cerrada > libre.
- El original llama `idCategoria` al parámetro de `GetProductos`, aunque en
  realidad recibe el id de la **subcategoría**; aquí se respeta tal cual.
- `PostInsertDetalleComanda` recibe un **array** de detalles, no un objeto.
- Se impide reservar dos veces la misma mesa el mismo día (409 Conflict).
