-- ============================================================
--  Base de datos: hosteleria
--  Esquema que replica la logica del API original
--  apiostalaritza.lhusurbil.eus
--
--  Tablas: Salas, Mesas, Reservas, Categorias, SubCategorias,
--          Productos, Comandas, DetalleComanda
--
--  La ejecuta automaticamente el script: npm run initdb
-- ============================================================

CREATE DATABASE IF NOT EXISTS hosteleria
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE hosteleria;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS DetalleComanda;
DROP TABLE IF EXISTS Comandas;
DROP TABLE IF EXISTS Reservas;
DROP TABLE IF EXISTS Productos;
DROP TABLE IF EXISTS SubCategorias;
DROP TABLE IF EXISTS Categorias;
DROP TABLE IF EXISTS Mesas;
DROP TABLE IF EXISTS Salas;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Salas
-- ------------------------------------------------------------

CREATE TABLE Salas (
    idSala      INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Mesas
--  numMesa es el identificador "visible" que usa la web
--  (data-id de los botones) en TODA la aplicacion
-- ------------------------------------------------------------

CREATE TABLE Mesas (
    idMesa      INT AUTO_INCREMENT PRIMARY KEY,
    numMesa     INT NOT NULL UNIQUE,
    idSala      INT NOT NULL,
    capacidad   INT NOT NULL DEFAULT 4,
    FOREIGN KEY (idSala) REFERENCES Salas(idSala)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Reservas
--  fecha: DATE 'YYYY-MM-DD' (la web la manda asi)
-- ------------------------------------------------------------

CREATE TABLE Reservas (
    idReserva           INT AUTO_INCREMENT PRIMARY KEY,
    fecha               DATE NOT NULL,
    idMesa              INT NOT NULL,
    numComensales       INT NOT NULL,
    nombreCliente       VARCHAR(100) NOT NULL,
    apellidoCliente     VARCHAR(100) NOT NULL,
    telefonoCliente     VARCHAR(30)  NOT NULL,
    emailCliente        VARCHAR(100),
    observaciones       VARCHAR(255),
    FOREIGN KEY (idMesa) REFERENCES Mesas(idMesa)
) ENGINE=InnoDB;

CREATE INDEX idx_reservas_fecha ON Reservas(fecha);

-- ------------------------------------------------------------
-- Carta: Categorias -> SubCategorias -> Productos
-- ------------------------------------------------------------

CREATE TABLE Categorias (
    idCategoria     INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE SubCategorias (
    idSubCategoria  INT AUTO_INCREMENT PRIMARY KEY,
    idCategoria     INT NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    FOREIGN KEY (idCategoria) REFERENCES Categorias(idCategoria)
) ENGINE=InnoDB;

CREATE TABLE Productos (
    idProducto      INT AUTO_INCREMENT PRIMARY KEY,
    idSubCategoria  INT NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    precio          DECIMAL(10,2) NOT NULL,
    numOrden        INT NOT NULL DEFAULT 1,
    FOREIGN KEY (idSubCategoria) REFERENCES SubCategorias(idSubCategoria)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Comandas
--  estadoAbierta: 1 = abierta, 0 = cerrada (facturada)
--  La fecha es la del DIA de la comanda (comparada con fecha
--  de reserva para marcar estados de mesa)
-- ------------------------------------------------------------

CREATE TABLE Comandas (
    idComanda       INT AUTO_INCREMENT PRIMARY KEY,
    idMesa          INT NOT NULL,
    fecha           DATE NOT NULL,
    estadoAbierta   TINYINT NOT NULL DEFAULT 1,
    cobrada         TINYINT NOT NULL DEFAULT 0,
    numComensales   INT NULL,
    FOREIGN KEY (idMesa) REFERENCES Mesas(idMesa)
) ENGINE=InnoDB;

CREATE INDEX idx_comandas_mesa_fecha ON Comandas(idMesa, fecha);
CREATE INDEX idx_comandas_fecha_estado ON Comandas(fecha, estadoAbierta);

-- ------------------------------------------------------------
-- DetalleComanda  (lineas de producto de cada comanda)
-- ------------------------------------------------------------

CREATE TABLE DetalleComanda (
    idDetalle       INT AUTO_INCREMENT PRIMARY KEY,
    idComanda       INT NOT NULL,
    idProducto      INT NOT NULL,
    cantidad        INT NOT NULL DEFAULT 1,
    FOREIGN KEY (idComanda) REFERENCES Comandas(idComanda) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES Productos(idProducto)
) ENGINE=InnoDB;

CREATE INDEX idx_detalle_comanda ON DetalleComanda(idComanda);
CREATE INDEX idx_detalle_producto ON DetalleComanda(idProducto);

-- ============================================================
--  DATOS DE EJEMPLO
-- ============================================================

-- Salas (la web usa los indices 0 y 1 de GetSalas)
INSERT INTO Salas (nombre) VALUES
    ('Sala Principal'),
    ('Terraza');

-- Mesas: sala 1 con 12 mesas, sala 2 con 8 -> numMesa GLOBAL unico
INSERT INTO Mesas (numMesa, idSala, capacidad) VALUES
    (1,  1, 4), (2,  1, 4), (3,  1, 6), (4,  1, 2),
    (5,  1, 4), (6,  1, 4), (7,  1, 6), (8,  1, 2),
    (9,  1, 8), (10, 1, 4), (11, 1, 4), (12, 1, 6),
    (13, 2, 4), (14, 2, 4), (15, 2, 4), (16, 2, 2),
    (17, 2, 4), (18, 2, 4), (19, 2, 2), (20, 2, 6);

-- Categorias
INSERT INTO Categorias (idCategoria, nombre) VALUES
    (1, 'Bebidas'),
    (2, 'Raciones'),
    (3, 'Pintxos'),
    (4, 'Postres');

-- SubCategorias
INSERT INTO SubCategorias (idSubCategoria, idCategoria, nombre) VALUES
    (1, 1, 'Refrescos'),
    (2, 1, 'Vinos'),
    (3, 2, 'Fritos'),
    (4, 2, 'Verduras'),
    (5, 3, 'Frios'),
    (6, 3, 'Calientes'),
    (7, 4, 'Caseros');

-- Productos
INSERT INTO Productos (idProducto, idSubCategoria, nombre, precio, numOrden) VALUES
    (1,  1, 'Coca-Cola',          2.80, 1),
    (2,  1, 'Kas Naranja',        2.60, 2),
    (3,  1, 'Agua mineral 50cl',  1.80, 3),
    (4,  1, 'Cerveza caÑa',       2.90, 4),
    (5,  2, 'Ribera crianza',     3.90, 1),
    (6,  2, 'Txakoli Getaria',    3.50, 2),
    (7,  3, 'Croquetas jamon',    8.50, 1),
    (8,  3, 'Bacalao rebozado',   9.20, 2),
    (9,  3, 'Calamares',          8.90, 3),
    (10, 3, 'Pechuga empanada',   7.50, 4),
    (11, 4, 'Pimientos verdes',   9.80, 1),
    (12, 4, 'Ensalada mixta',     7.80, 2),
    (13, 5, 'Gilda',              2.50, 1),
    (14, 5, 'Anchoa',             3.20, 2),
    (15, 5, 'Tortilla pintxo',   2.40, 3),
    (16, 6, 'Huevo relleno',      2.80, 1),
    (17, 6, 'Pintxo morcilla',    3.00, 2),
    (18, 6, 'Chistorra a la sidra', 3.50, 3),
    (19, 7, 'Tarta queso',        5.50, 1),
    (20, 7, 'Torrija',            5.00, 2),
    (21, 7, 'Helado',             4.00, 3);
