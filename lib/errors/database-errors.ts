/**
 * Clase base para todos los errores relacionados con la base de datos
 */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DatabaseError"
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

/**
 * Error que ocurre cuando no se puede establecer conexión con la base de datos
 */
export class ConnectionError extends DatabaseError {
  constructor(message = "No se pudo establecer conexión con la base de datos") {
    super(message)
    this.name = "ConnectionError"
    Object.setPrototypeOf(this, ConnectionError.prototype)
  }
}

/**
 * Error que ocurre cuando una consulta a la base de datos falla
 */
export class QueryError extends DatabaseError {
  public query: string
  public params?: any[]

  constructor(message: string, query: string, params?: any[]) {
    super(message)
    this.name = "QueryError"
    this.query = query
    this.params = params
    Object.setPrototypeOf(this, QueryError.prototype)
  }
}

/**
 * Error que ocurre cuando una operación de base de datos tarda demasiado tiempo
 */
export class TimeoutError extends DatabaseError {
  public timeout: number

  constructor(message = "La operación de base de datos ha excedido el tiempo límite", timeout = 30000) {
    super(message)
    this.name = "TimeoutError"
    this.timeout = timeout
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

/**
 * Error que ocurre cuando se viola una restricción de integridad en la base de datos
 */
export class IntegrityError extends DatabaseError {
  public constraint?: string

  constructor(message: string, constraint?: string) {
    super(message)
    this.name = "IntegrityError"
    this.constraint = constraint
    Object.setPrototypeOf(this, IntegrityError.prototype)
  }
}

/**
 * Error que ocurre cuando no se tienen los permisos necesarios para realizar una operación
 */
export class PermissionError extends DatabaseError {
  public operation: string
  public resource: string

  constructor(message: string, operation: string, resource: string) {
    super(message)
    this.name = "PermissionError"
    this.operation = operation
    this.resource = resource
    Object.setPrototypeOf(this, PermissionError.prototype)
  }
}
