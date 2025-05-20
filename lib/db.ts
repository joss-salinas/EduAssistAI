import mysql from "mysql2/promise"

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "edu_assistant_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function executeQuery(query: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(query, params)
    return results
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error)
    throw error
  }
}

export default pool
