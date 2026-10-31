// Rutas de Comandas y su detalle
// Contrato identico al del API original
// OJO: en toda la app los "idMesa" que llegan por query son numMesa
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /PostCrearComanda?idMesa=&numComensales=
// numComensales es opcional (walk-in): se valida contra la capacidad de la mesa
router.post('/PostCrearComanda', async (req, res) => {
    try {
        const numMesa = req.query.idMesa;
        if (!numMesa) return res.status(400).json({ ok: false, error: 'Falta el parametro idMesa' });

        const [mesas] = await db.query(
            'SELECT idMesa, capacidad FROM Mesas WHERE numMesa = ?',
            [Number(numMesa)]
        );
        if (mesas.length === 0) {
            return res.status(404).json({ ok: false, error: 'No existe la mesa indicada' });
        }

        // Walk-in con comensales informados (elige incluirlos en la comanda)
        let numComensales = null;
        if (req.query.numComensales !== undefined && req.query.numComensales !== '') {
            numComensales = Number(req.query.numComensales);
            if (Number.isNaN(numComensales) || numComensales <= 0) {
                return res.status(400).json({ ok: false, error: 'El numero de comensales no es valido' });
            }
            const capacidad = Number(mesas[0].capacidad);
            if (numComensales > capacidad) {
                return res.status(400).json({
                    ok: false,
                    error: `La mesa ${numMesa} admite como maximo ${capacidad} comensales`
                });
            }
        }

        const [result] = await db.query(
            `INSERT INTO Comandas (idMesa, fecha, estadoAbierta, numComensales)
             VALUES (?, CURDATE(), 1, ?)`,
            [mesas[0].idMesa, numComensales]
        );

        res.status(201).json({ ok: true, idComanda: result.insertId });
    } catch (err) { nextDBError(res, err); }
});

// GET /GetComandasMesaAbiertas?idMesa= -> { comandas: [ { idComanda, ... } ] }
router.get('/GetComandasMesaAbiertas', async (req, res) => {
    try {
        const numMesa = req.query.idMesa;
        if (!numMesa) return res.status(400).json({ error: 'Falta el parametro idMesa' });

        const [rows] = await db.query(
            `SELECT c.idComanda, c.fecha, c.estadoAbierta
               FROM Comandas c
               JOIN Mesas m ON m.idMesa = c.idMesa
              WHERE m.numMesa = ?
                AND c.estadoAbierta = 1
              ORDER BY c.idComanda`,
            [Number(numMesa)]
        );
        res.json({ comandas: rows });
    } catch (err) { nextDBError(res, err); }
});

// GET /GetDetalleComanda?idComanda=
// -> { detalleComandas: [ { idProducto, nombre, precio, cantidad } ] }
router.get('/GetDetalleComanda', async (req, res) => {
    try {
        const idComanda = req.query.idComanda;
        if (!idComanda) return res.status(400).json({ error: 'Falta el parametro idComanda' });

        const [rows] = await db.query(
            `SELECT dc.idProducto, p.nombre, p.precio, dc.cantidad
               FROM DetalleComanda dc
               JOIN Productos p ON p.idProducto = dc.idProducto
              WHERE dc.idComanda = ?
              ORDER BY dc.idDetalle`,
            [Number(idComanda)]
        );
        res.json({ detalleComandas: rows });
    } catch (err) { nextDBError(res, err); }
});

// POST /PostInsertDetalleComanda
// body: [ { idComanda, idProducto, cantidad }, ... ]
router.post('/PostInsertDetalleComanda', async (req, res) => {
    try {
        const detalles = req.body;

        if (!Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({ ok: false, error: 'Se espera un array de detalles' });
        }
        for (const d of detalles) {
            if (!d.idComanda || !d.idProducto || !d.cantidad || d.cantidad <= 0) {
                return res.status(400).json({
                    ok: false,
                    error: 'Cada detalle debe llevar idComanda, idProducto y cantidad > 0'
                });
            }
        }

        const [mesaDeComanda] = await db.query(
            'SELECT idComanda FROM Comandas WHERE idComanda = ?',
            [Number(detalles[0].idComanda)]
        );
        if (mesaDeComanda.length === 0) {
            return res.status(404).json({ ok: false, error: 'No existe la comanda indicada' });
        }

        const valores = detalles.map(d => [Number(d.idComanda), Number(d.idProducto), Number(d.cantidad)]);
        const [result] = await db.query(
            'INSERT INTO DetalleComanda (idComanda, idProducto, cantidad) VALUES ?',
            [valores]
        );

        res.status(201).json({ ok: true, insertados: result.affectedRows });
    } catch (err) { nextDBError(res, err); }
});

// PUT /PutCobrarMesa?idMesa=
// Marca como cobradas las comandas abiertas de HOY de esa mesa (numMesa).
// La mesa pasa a AZUL mientras se termina la factura, y VERDE al cerrarla.
router.put('/PutCobrarMesa', async (req, res) => {
    try {
        const numMesa = req.query.idMesa;
        if (!numMesa) return res.status(400).json({ ok: false, error: 'Falta el parametro idMesa' });

        const [mesas] = await db.query(
            'SELECT idMesa FROM Mesas WHERE numMesa = ?',
            [Number(numMesa)]
        );
        if (mesas.length === 0) {
            return res.status(404).json({ ok: false, error: 'No existe la mesa indicada' });
        }

        const [result] = await db.query(
            `UPDATE Comandas
                SET cobrada = 1
              WHERE idMesa = ?
                AND fecha = CURDATE()
                AND estadoAbierta = 1`,
            [mesas[0].idMesa]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, error: 'No hay comandas abiertas para esa mesa hoy' });
        }
        res.json({ ok: true, cobradas: result.affectedRows });
    } catch (err) { nextDBError(res, err); }
});

// PUT /PutCerrarComanda?idComanda=
// Cerrar la comanda = mesa cobrada y finalizada -> VUELVE A VERDE
router.put('/PutCerrarComanda', async (req, res) => {
    try {
        const idComanda = req.query.idComanda;
        if (!idComanda) return res.status(400).json({ ok: false, error: 'Falta el parametro idComanda' });

        const [result] = await db.query(
            'UPDATE Comandas SET estadoAbierta = 0, cobrada = 1 WHERE idComanda = ?',
            [Number(idComanda)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, error: 'Comanda no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Comanda cerrada' });
    } catch (err) { nextDBError(res, err); }
});

function nextDBError(res, err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error de base de datos' });
}

module.exports = router;
