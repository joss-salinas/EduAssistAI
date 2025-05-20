import type { DatabaseError } from "./database-errors"

/**
 * Niveles de log disponibles
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

/**
 * Interfaz para los servicios de log externos
 */
interface LogService {
  log(level: LogLevel, message: string, meta?: Record<string, any>): void
}

/**
 * Servicio de log que escribe en la consola
 */
class ConsoleLogService implements LogService {
  log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString()
    const metaString = meta ? JSON.stringify(meta) : ""

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[${timestamp}] [DEBUG] ${message}`, meta || "")
        break
      case LogLevel.INFO:
        console.info(`[${timestamp}] [INFO] ${message}`, meta || "")
        break
      case LogLevel.WARN:
        console.warn(`[${timestamp}] [WARN] ${message}`, meta || "")
        break
      case LogLevel.ERROR:
        console.error(`[${timestamp}] [ERROR] ${message}`, meta || "")
        break
      case LogLevel.FATAL:
        console.error(`[${timestamp}] [FATAL] ${message}`, meta || "")
        break
    }
  }
}

/**
 * Clase singleton para el registro centralizado de errores
 */
export class ErrorLogger {
  private static instance: ErrorLogger
  private services: LogService[] = []
  private minLevel: LogLevel = LogLevel.INFO

  private constructor() {
    // Por defecto, añadir el servicio de consola
    this.services.push(new ConsoleLogService())
  }

  /**
     añadir el servicio de consola
    this.services.push(new ConsoleLogService());
  }

  /**
   * Obtiene la instancia única del logger
   */
  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Establece el nivel mínimo de log
   */
  public setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * Añade un servicio de log
   */
  public addService(service: LogService): void {
    this.services.push(service)
  }

  /**
   * Registra un mensaje de debug
   */
  public debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta)
  }

  /**
   * Registra un mensaje informativo
   */
  public info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta)
  }

  /**
   * Registra una advertencia
   */
  public warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta)
  }

  /**
   * Registra un error
   */
  public error(message: string, error?: Error, meta?: Record<string, any>): void {
    const errorMeta = this.getErrorMeta(error, meta)
    this.log(LogLevel.ERROR, message, errorMeta)
  }

  /**
   * Registra un error fatal
   */
  public fatal(message: string, error?: Error, meta?: Record<string, any>): void {
    const errorMeta = this.getErrorMeta(error, meta)
    this.log(LogLevel.FATAL, message, errorMeta)
  }

  /**
   * Registra un error de base de datos
   */
  public databaseError(message: string, error: DatabaseError, meta?: Record<string, any>): void {
    const errorMeta = {
      ...meta,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    }

    // Añadir información específica según el tipo de error
    if ("query" in error) {
      errorMeta["query"] = (error as any).query
      errorMeta["params"] = (error as any).params
    }
    if ("constraint" in error) {
      errorMeta["constraint"] = (error as any).constraint
    }
    if ("operation" in error) {
      errorMeta["operation"] = (error as any).operation
      errorMeta["resource"] = (error as any).resource
    }

    this.log(LogLevel.ERROR, message, errorMeta)
  }

  /**
   * Método privado para registrar un mensaje en todos los servicios
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    // Verificar si el nivel es suficiente para registrar
    const levels = Object.values(LogLevel)
    const minLevelIndex = levels.indexOf(this.minLevel)
    const currentLevelIndex = levels.indexOf(level)

    if (currentLevelIndex >= minLevelIndex) {
      for (const service of this.services) {
        service.log(level, message, meta)
      }
    }
  }

  /**
   * Método privado para extraer metadatos de un error
   */
  private getErrorMeta(error?: Error, meta?: Record<string, any>): Record<string, any> {
    if (!error) {
      return meta || {}
    }

    return {
      ...meta,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    }
  }
}
