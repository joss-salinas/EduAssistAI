/**
 * Normaliza una respuesta de Rasa para asegurar que tenga un formato consistente
 */
export function normalizeRasaResponse(response: any): any {
  // Si no es un array, convertirlo en uno
  if (!Array.isArray(response)) {
    return []
  }

  // Normalizar cada elemento del array
  return response
    .map((item) => {
      // Si no es un objeto, ignorarlo
      if (typeof item !== "object" || item === null) {
        return null
      }

      // Asegurar que tenga un recipient_id
      const normalized = {
        recipient_id: item.recipient_id || "default",
      }

      // Copiar propiedades válidas
      if (typeof item.text === "string") {
        normalized.text = item.text
      }

      if (typeof item.image === "string") {
        normalized.image = item.image
      }

      if (Array.isArray(item.buttons)) {
        normalized.buttons = item.buttons
          .filter((button) => typeof button === "object" && button !== null)
          .map((button) => ({
            title: typeof button.title === "string" ? button.title : "Botón",
            payload: typeof button.payload === "string" ? button.payload : "",
          }))
      }

      if (item.custom !== undefined) {
        normalized.custom = item.custom
      }

      return normalized
    })
    .filter(Boolean) // Eliminar elementos nulos
}
