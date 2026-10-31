// Servidor principal
// Clona el API de apiostalaritza.lhusurbil.eus en local:
//   npm run initdb   -> crea la BD una vez
//   npm start        -> arranca el servidor en PORT (.env, por defecto 3000)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const salasMesas = require('./routes/salasMesas');
const reservas = require('./routes/reservas');
const carta = require('./routes/carta');
const comandas = require('./routes/comandas');

const app = express();

// La web (file:// o Live Server) consume esta API desde otro origen
app.use(cors());
app.use(express.json());

// Los endpoints van en la raiz, tal y como los llama la web
app.use('/', salasMesas);
app.use('/', reservas);
app.use('/', carta);
app.use('/', comandas);

app.use((req, res) => {
    res.status(404).json({ error: `Endpoint no encontrado: ${req.method} ${req.originalUrl}` });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    console.log(`API Hosteleria escuchando en http://localhost:${PORT}`);
    console.log('Endpoints disponibles (GET salvo loss indicados):');
    console.log('  GetSalas | GetMesas?idSala= | GetEstadoMesas?fecha=');
    console.log('  GetMesasOcupadasFecha?fecha= | GetMesasLibresFecha?numComensales=&fecha=');
    console.log('  GetReservasDia?fecha= | GetCategorias | GetSubCategorias?idCategoria=');
    console.log('  GetProductos?idCategoria= | GetComandasMesaAbiertas?idMesa= | GetDetalleComanda?idComanda=');
    console.log('  POST PostReservar | POST PostCrearComanda?idMesa= | POST PostInsertDetalleComanda');
    console.log('  PUT PutCerrarComanda?idComanda= | DELETE DeleteReserva?idreserva=');
});
