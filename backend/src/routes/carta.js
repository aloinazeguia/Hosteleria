// Rutas de la carta: Categorias, SubCategorias y Productos
// Contrato identico al del API original
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /GetCategorias -> { categorias: [ { id, nombre } ] }
router.get('/GetCategorias', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT idCategoria AS id, nombre FROM Categorias ORDER BY idCategoria'
        );
        res.json({ categorias: rows });
    } catch (err) { nextDBError(res, err); }
});

// GET /GetSubCategorias?idCategoria=
// OJO: la web espera que el array se llame "categorias" (no subCategorias)
router.get('/GetSubCategorias', async (req, res) => {
    try {
        const idCategoria = req.query.idCategoria;
        if (!idCategoria) return res.status(400).json({ error: 'Falta el parametro idCategoria' });

        const [rows] = await db.query(
            `SELECT idSubCategoria AS id, nombre
               FROM SubCategorias
              WHERE idCategoria = ?
              ORDER BY idSubCategoria`,
            [idCategoria]
        );
        res.json({ categorias: rows });
    } catch (err) { nextDBError(res, err); }
});

// GET /GetProductos?idCategoria=
// En la practica el frontend pasa aqui el id de la SUBCATEGORIA
router.get('/GetProductos', async (req, res) => {
    try {
        const idSubCategoria = req.query.idCategoria;
        if (!idSubCategoria) return res.status(400).json({ error: 'Falta el parametro idCategoria' });

        const [rows] = await db.query(
            `SELECT idProducto AS id, nombre, precio, numOrden
               FROM Productos
              WHERE idSubCategoria = ?
              ORDER BY numOrden, idProducto`,
            [idSubCategoria]
        );
        res.json({ productos: rows });
    } catch (err) { nextDBError(res, err); }
});

function nextDBError(res, err) {
    console.error(err);
    res.status(500).json({ error: 'Error de base de datos' });
}

module.exports = router;
