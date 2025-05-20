import mysql from "mysql2/promise"
import {
  DatabaseError,
  ConnectionError,
  QueryError,
  TimeoutError,
  IntegrityError,
  PermissionError,
} from "./errors/database-errors"
import { ErrorLogger } from "./errors/error-logger"
import { RetryManager } from "./errors/retry-manager"

// Inicializar logger de errores
const errorLogger = new ErrorLogger()

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "edu_assistant_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 segundos
  acquireTimeout: 10000, // 10 segundos
})

// Función para clasificar y manejar errores de MySQL
function handleMySQLError(error: any, query: string, params: any[]): never {
  // Registrar información detallada sobre el error
  errorLogger.logError({
    message: error.message,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage,
    sql: error.sql || query,
    params,
    stack: error.stack,
    timestamp: new Date(),
  })

  // Determinar el tipo de error basándose en los códigos de error de MySQL
  if (
    error.code === "ECONNREFUSED" ||
    error.code === "PROTOCOL_CONNECTION_LOST" ||
    error.code === "ENOTFOUND" ||
    error.code === "ETIMEDOUT"
  ) {
    throw new ConnectionError("Error de conexión a la base de datos", error)
  }

  if (error.code === "ETIMEDOUT" || error.code === "PROTOCOL_SEQUENCE_TIMEOUT") {
    throw new TimeoutError("La consulta a la base de datos ha excedido el tiempo límite", error)
  }

  if (error.code === "ER_DUP_ENTRY" || error.code === "ER_NO_REFERENCED_ROW" || error.code === "ER_ROW_IS_REFERENCED") {
    throw new IntegrityError("Error de integridad de datos", error)
  }

  if (
    error.code === "ER_ACCESS_DENIED_ERROR" ||
    error.code === "ER_DBACCESS_DENIED_ERROR" ||
    error.code === "ER_TABLEACCESS_DENIED_ERROR"
  ) {
    throw new PermissionError("Error de permisos en la base de datos", error)
  }

  // Error de consulta genérico para cualquier otro error
  throw new QueryError(`Error en la consulta SQL: ${error.message}`, error)
}

// Crear un gestor de reintentos con configuración personalizada
const retryManager = new RetryManager({
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 3000,
  shouldRetry: (error) => error instanceof ConnectionError || error instanceof TimeoutError,
})

// Función principal para ejecutar consultas con reintentos y manejo de errores
export async function executeQuery(
  query: string,
  params: any[] = [],
  options: {
    retryEnabled?: boolean
    transactionConn?: mysql.PoolConnection
  } = {},
) {
  const { retryEnabled = true, transactionConn } = options

  // Función que ejecuta la consulta
  const executeDbQuery = async () => {
    try {
      // Usa la conexión proporcionada si está en una transacción, o toma una del pool
      const conn = transactionConn || pool

      // Ejecutar la consulta
      const [results] = await conn.execute(query, params)
      return results
    } catch (error: any) {
      // Manejar el error y convertirlo a un tipo específico
      handleMySQLError(error, query, params)
    }
  }

  // Si los reintentos están habilitados y no es parte de una transacción, usa el gestor de reintentos
  if (retryEnabled && !transactionConn) {
    return await retryManager.executeWithRetry(executeDbQuery)
  } else {
    // Si es parte de una transacción o los reintentos están deshabilitados, ejecuta directamente
    return await executeDbQuery()
  }
}

// Función para iniciar una transacción con manejo de errores
export async function beginTransaction() {
  try {
    const connection = await pool.getConnection()
    await connection.beginTransaction()
    return connection
  } catch (error: any) {
    handleMySQLError(error, "BEGIN TRANSACTION", [])
  }
}

// Función para ejecutar múltiples consultas en una transacción
export async function executeTransaction<T>(
  queries: Array<{ query: string; params: any[] }>,
  callback?: (results: any[]) => T,
): Promise<T | any[]> {
  let connection: mysql.PoolConnection | null = null
  try {
    connection = await beginTransaction()
    const results: any[] = []

    // Ejecutar cada consulta en la transacción
    for (const { query, params } of queries) {
      const result = await executeQuery(query, params, {
        retryEnabled: false,
        transactionConn: connection,
      })
      results.push(result)
    }

    // Confirmar la transacción
    await connection.commit()

    // Liberar la conexión
    connection.release()

    // Devolver los resultados procesados si se proporciona una función de callback
    return callback ? callback(results) : results
  } catch (error: any) {
    // Si hay un error, revertir la transacción
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        errorLogger.logError({
          message: "Error al revertir la transacción",
          originalError: error,
          rollbackError,
          timestamp: new Date(),
        })
      } finally {
        connection.release()
      }
    }

    // Si es un error de base de datos ya procesado, simplemente propagarlo
    if (error instanceof DatabaseError) {
      throw error
    }

    // De lo contrario, procesar el error
    handleMySQLError(error, "TRANSACTION", [])
  }
}

// Función para comprobar la salud de la conexión a la base de datos
export async function checkDatabaseHealth() {
  try {
    await executeQuery("SELECT 1 AS health_check", [])
    return { status: "healthy", message: "Conexión a la base de datos establecida" }
  } catch (error) {
    return {
      status: "unhealthy",
      message: error instanceof DatabaseError ? error.message : "Error desconocido en la base de datos",
      error: error instanceof DatabaseError ? error.code : "UNKNOWN_ERROR",
    }
  }
}

export default pool
