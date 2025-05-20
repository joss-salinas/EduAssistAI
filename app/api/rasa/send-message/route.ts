import { type NextRequest, NextResponse } from "next/server"
import { safeSerialize } from "@/lib/serialization-utils"
import { validateRequest } from "@/lib/validation/validate-middleware"
import { sendMessageSchema, rasaResponseSchema } from "@/lib/validation/schemas"
import { sanitizeInput } from "@/lib/validation/sanitize"
import { normalizeRasaResponse } from "@/lib/validation/normalize"
import { logValidationError } from "@/lib/validation/validation-logger"

export async function POST(req: NextRequest) {
  try {
    // Validar y sanitizar los datos de entrada
    const validationResult = await validateRequest(req, sendMessageSchema)

    if (!validationResult.success) {
      logValidationError("send-message", "input", validationResult.error)
      return NextResponse.json(
        { error: "Datos de entrada inválidos", details: validationResult.error.errors },
        { status: 400 },
      )
    }

    const { message, userId = "default" } = validationResult.data

    // Sanitizar la entrada para prevenir inyecciones
    const sanitizedMessage = sanitizeInput(message)
    const sanitizedUserId = sanitizeInput(userId)

    // Construir la URL de la API de Rasa
    const rasaUrl = process.env.NEXT_PUBLIC_RASA_API_URL || "http://localhost:5005"
    const endpoint = `${rasaUrl}/webhooks/rest/webhook`

    // Enviar la petición a Rasa
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: sanitizedUserId,
        message: sanitizedMessage,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error al comunicarse con Rasa: ${response.statusText}`)
    }

    // Obtener la respuesta
    const rawData = await response.json()

    // Validar la respuesta de Rasa
    const responseValidation = rasaResponseSchema.safeParse(rawData)

    if (!responseValidation.success) {
      logValidationError("send-message", "output", responseValidation.error)

      // Intentar normalizar la respuesta
      const normalizedData = normalizeRasaResponse(rawData)
      const normalizedValidation = rasaResponseSchema.safeParse(normalizedData)

      if (!normalizedValidation.success) {
        return NextResponse.json({ error: "Respuesta de Rasa inválida", fallbackResponse: [] }, { status: 200 })
      }

      // Devolver la respuesta normalizada
      return NextResponse.json(safeSerialize(normalizedData))
    }

    // Serializar la respuesta validada
    const serializedData = safeSerialize(responseValidation.data)

    return NextResponse.json(serializedData)
  } catch (error) {
    console.error("Error en la API de Rasa:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud a Rasa", fallbackResponse: [] }, { status: 500 })
  }
}
