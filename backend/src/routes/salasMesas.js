// Rutas de Salas y Mesas
// Contrato identico al del API original: la web NO necesita cambios
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/GetSalas', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT idSala, nombre FROM Salas ORDER BY idSala'
        );
        res.json({ salas: rows });
    } catch (err) { nextDBError(res, err); }
});

// La web usa los indices 0 y 1 de GetSalas y pasa idSala a este endpoint
router.get('/GetMesas', async (req, res) => {
    try {
        const idSala = req.query.idSala;
        if (!idSala) return res.status(400).json({ error: 'Falta el parametro idSala' });

        const [rows] = await db.query(
            `SELECT idMesa, numMesa, capacidad
               FROM Mesas
              WHERE idSala = ?
              ORDER BY numMesa`,
            [idSala]
        );
        res.json({ mesas: rows });
    } catch (err) { nextDBError(res, err); }
});

// GET /GetMesa?numMesa= -> datos de una mesa concreta (p.ej. capacidad para walk-in)
router.get('/GetMesa', async (req, res) => {
    try {
        const numMesa = req.query.numMesa;
        if (!numMesa) return res.status(400).json({ error: 'Falta el parametro numMesa' });

        const [rows] = await db.query(
            `SELECT idMesa, numMesa, capacidad, idSala
               FROM Mesas
              WHERE numMesa = ?`,
            [Number(numMesa)]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No existe la mesa indicada' });
        }
        res.json({ mesa: rows[0] });
    } catch (err) { nextDBError(res, err); }
});

// Estados: 0 libre, 1 ocupada (comanda abierta o reserva de hoy), 3 facturada sin cobrar
// Prioridad: cobrandose (3) > ocupada/reserva(1) > libre (0)
// Mesa con comanda cerrada de hoy: cobrada -> verde; si se cerro sin cobro -> azul
router.get('/GetEstadoMesas', async (req, res) => {
    try {
        const fecha = req.query.fecha || hoyISO();
        const [rows] = await db.query(
            `SELECT m.numMesa,
                    CASE
                        WHEN EXISTS (
                            SELECT 1 FROM Comandas c
                             WHERE c.idMesa = m.idMesa
                               AND c.fecha = ?
                               AND c.estadoAbierta = 1
                               AND c.cobrada = 1
                        ) THEN 3
                        WHEN EXISTS (
                            SELECT 1 FROM Comandas c
                             WHERE c.idMesa = m.idMesa
                               AND c.fecha = ?
                               AND c.estadoAbierta = 1
                               AND c.cobrada = 0
                        ) THEN 1
                        WHEN EXISTS (
                            SELECT 1 FROM Reservas r
                             WHERE r.idMesa = m.idMesa
                               AND r.fecha = ?
                        ) THEN 1
                        WHEN EXISTS (
                            SELECT 1 FROM Comandas c
                             WHERE c.idMesa = m.idMesa
                               AND c.fecha = ?
                               AND c.estadoAbierta = 0
                               AND c.cobrada = 0
                        ) THEN 3
                        ELSE 0
                    END AS estado
               FROM Mesas m
              ORDER BY m.numMesa`,
            [fecha, fecha, fecha, fecha]
        );
        // La web compara este idMesa con el data-id de las mesas, que es numMesa
        res.json({ estados: rows.map(r => ({ idMesa: r.numMesa, estado: r.estado })) });
    } catch (err) { nextDBError(res, err); }
});

// Mesas reservadas u ocupadas hoy -> contador de comensales de la vista de salas
// Reservas de hoy + comandas abiertas de hoy SIN reserva (walk-ins) y SIN
// comanda abierta (reservas ya sentadas), para no contar a nadie dos veces
router.get('/GetMesasOcupadasFecha', async (req, res) => {
    try {
        const fecha = req.query.fecha || hoyISO();
        const [rows] = await db.query(
            `SELECT m.numMesa, r.numComensales
               FROM Reservas r
               JOIN Mesas m ON m.idMesa = r.idMesa
              WHERE r.fecha = ?
                AND NOT EXISTS (
                    SELECT 1 FROM Comandas c
                     WHERE c.idMesa = r.idMesa AND c.fecha = r.fecha AND c.estadoAbierta = 1
                )
              UNION ALL
              SELECT m.numMesa, c.numComensales
               FROM Comandas c
               JOIN Mesas m ON m.idMesa = c.idMesa
              WHERE c.fecha = ?
                AND c.estadoAbierta = 1
                AND c.numComensales IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM Reservas r
                     WHERE r.idMesa = c.idMesa AND r.fecha = c.fecha
                )
              ORDER BY numMesa`,
            [fecha, fecha]
        );
        res.json({ mesas: rows });
    } catch (err) { nextDBError(res, err); }
});

// Mesas libres para una fecha y un numero de comensales:
// capacidad mayor o igual, sin reserva hoy y sin comanda abierta hoy
router.get('/GetMesasLibresFecha', async (req, res) => {
    try {
        const numComensales = Number(req.query.numComensales);
        const fecha = req.query.fecha || hoyISO();
        if (!numComensales || numComensales <= 0) {
            return res.status(400).json({ error: 'numComensales no valido' });
        }

        const [rows] = await db.query(
            `SELECT m.numMesa
               FROM Mesas m
              WHERE m.capacidad >= ?
                AND NOT EXISTS (
                    SELECT 1 FROM Reservas r
                     WHERE r.idMesa = m.idMesa AND r.fecha = ?
                )
                AND NOT EXISTS (
                    SELECT 1 FROM Comandas c
                     WHERE c.idMesa = m.idMesa
                       AND c.fecha = ?
                       AND c.estadoAbierta = 1
                )
              ORDER BY m.capacidad, m.numMesa`,
            [numComensales, fecha, fecha]
        );
        res.json({ mesas: rows });
    } catch (err) { nextDBError(res, err); }
});

function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}

function nextDBError(res, err) {
    console.error(err);
    res.status(500).json({ error: 'Error de base de datos' });
}

module.exports = router;
