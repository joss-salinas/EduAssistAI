/**
 * Sanitiza una cadena de texto para prevenir inyecciones y otros problemas de seguridad
 */
export function sanitizeInput(input: string): string {
  if (!input) return ""

  // Eliminar caracteres potencialmente peligrosos
  let sanitized = input
    .trim()
    // Prevenir inyección HTML/JavaScript
    .replace(/<(script|iframe|object|embed|applet)/gi, "&lt;$1")
    // Prevenir inyección SQL básica
    .replace(/('|"|;|--|\/\*|\*\/|@@|@)/g, "")

  // Truncar si es demasiado largo
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000)
  }

  return sanitized
}
