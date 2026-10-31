// Crea la base de datos, las tablas y los datos de ejemplo
// Ejecucion: npm run initdb   (o node src/initdb.js)
const fs = require('fs');
    const path = require('path');
    const mysql = require('mysql2/promise');
    require('dotenv').config();

    async function main() {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        const sqlPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Ejecutando ${sqlPath} ...`);
        await connection.query(sql);
        console.log('✔ Base de datos "hosteleria" creada con tablas y datos de ejemplo.');

        await connection.end();
    }

    main().catch(err => {
        console.error('✖ Error al inicializar la base de datos:');
        console.error(err.message);
        process.exit(1);
    });
