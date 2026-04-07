const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function testDatabaseConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("Banco conectado com sucesso!");
    conn.release();
  } catch (error) {
    console.error("Erro ao conectar no banco:", error.message);
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
};