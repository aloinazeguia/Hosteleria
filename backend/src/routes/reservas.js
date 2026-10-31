// Rutas de Reservas
// Contrato identico al del API original
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /PostReservar
// body: fecha, numMesa, nombreCliente, apellidoCliente, telefonoCliente,
//       emailCliente, numComensales, observaciones
router.post('/PostReservar', async (req, res) => {
    try {
        const d = req.body || {};
        const campos = ['fecha', 'numMesa', 'nombreCliente', 'apellidoCliente',
            'telefonoCliente', 'numComensales'];
        for (const c of campos) {
            if (d[c] === undefined || d[c] === null || d[c] === '') {
                return res.status(400).json({ ok: false, error: `Falta el campo ${c}` });
            }
        }

        // La web trabaja con numMesa -> se resuelve a idMesa
        const [mesas] = await db.query(
            'SELECT idMesa FROM Mesas WHERE numMesa = ?',
            [Number(d.numMesa)]
        );
        if (mesas.length === 0) {
            return res.status(404).json({ ok: false, error: 'No existe la mesa indicada' });
        }

        // Validar numero de comensales
        const numComensales = Number(d.numComensales);
        if (Number.isNaN(numComensales) || numComensales <= 0) {
            return res.status(400).json({ ok: false, error: 'El numero de comensales no es valido' });
        }

        // Validar capacidad de la mesa
        const [cap] = await db.query(
            'SELECT capacidad FROM Mesas WHERE idMesa = ?',
            [mesas[0].idMesa]
        );
        const capacidad = Number(cap[0].capacidad);
        if (numComensales > capacidad) {
            return res.status(400).json({
                ok: false,
                error: `La mesa ${d.numMesa} admite como maximo ${capacidad} comensales`
            });
        }

        // Comprobar que la mesa sigue libre ese dia
        const [duplicadas] = await db.query(
            'SELECT 1 FROM Reservas WHERE idMesa = ? AND fecha = ?',
            [mesas[0].idMesa, d.fecha]
        );
        if (duplicadas.length > 0) {
            return res.status(409).json({ ok: false, error: 'La mesa ya esta reservada para ese dia' });
        }

        await db.query(
            `INSERT INTO Reservas
                    (fecha, idMesa, numComensales, nombreCliente,
                     apellidoCliente, telefonoCliente, emailCliente, observaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                d.fecha,
                mesas[0].idMesa,
                Number(d.numComensales),
                d.nombreCliente,
                d.apellidoCliente,
                d.telefonoCliente,
                d.emailCliente || null,
                d.observaciones || null
            ]
        );

        res.status(201).json({ ok: true, mensaje: 'Reserva registrada' });
    } catch (err) { nextDBError(res, err); }
});

// GET /GetReservasDia?fecha=
router.get('/GetReservasDia', async (req, res) => {
    try {
        const fecha = req.query.fecha || hoyISO();
        const [rows] = await db.query(
            `SELECT r.idReserva, r.fecha, m.numMesa, r.numComensales,
                    r.nombreCliente, r.apellidoCliente,
                    r.telefonoCliente, r.observaciones
               FROM Reservas r
               JOIN Mesas m ON m.idMesa = r.idMesa
              WHERE r.fecha = ?
              ORDER BY m.numMesa`,
            [fecha]
        );
        res.json({ reservas: rows });
    } catch (err) { nextDBError(res, err); }
});

// DELETE /DeleteReserva?idreserva=
router.delete('/DeleteReserva', async (req, res) => {
    try {
        const idReserva = req.query.idreserva;
        if (!idReserva) return res.status(400).json({ ok: false, error: 'Falta idreserva' });

        const [result] = await db.query(
            'DELETE FROM Reservas WHERE idReserva = ?',
            [Number(idReserva)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, error: 'Reserva no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Reserva eliminada' });
    } catch (err) { nextDBError(res, err); }
});

function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}

function nextDBError(res, err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error de base de datos' });
}

module.exports = router;
