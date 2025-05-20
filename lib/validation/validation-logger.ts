import type { ZodError } from "zod"

/**
 * Registra un error de validación para análisis posterior
 */
export function logValidationError(endpoint: string, type: "input" | "output", error: ZodError): void {
  console.error(`Error de validación en ${endpoint} (${type}):`, {
    timestamp: new Date().toISOString(),
    endpoint,
    type,
    errors: error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
      code: err.code,
    })),
  })

  // Aquí podrías implementar lógica adicional como:
  // - Enviar a un servicio de monitoreo
  // - Almacenar en base de datos
  // - Notificar a administradores
}
