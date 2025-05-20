/**
 * Serializa de forma segura cualquier objeto para asegurar que sea compatible con Next.js
 * Convierte instancias de clases, objetos con prototipos nulos y estructuras complejas
 * en objetos planos que pueden ser pasados entre Server Components y Client Components.
 */
export function safeSerialize<T>(data: T): T {
  try {
    // Usar JSON.parse/stringify para eliminar métodos, funciones y convertir a objetos planos
    return JSON.parse(JSON.stringify(data))
  } catch (error) {
    console.error("Error al serializar datos:", error)
    // En caso de error, devolver un objeto vacío del mismo tipo
    return Array.isArray(data) ? ([] as unknown as T) : ({} as T)
  }
}
