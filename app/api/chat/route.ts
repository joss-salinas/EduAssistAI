import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message, userId = "default" } = await req.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          error: "Mensaje inválido",
          response: "Lo siento, no pude entender tu mensaje. ¿Podrías intentarlo de nuevo?",
        },
        { status: 400 },
      )
    }

    console.log(`Processing chat message: "${message}" from user: ${userId}`)

    // Get the Rasa API URL from environment variables
    const rasaUrl = process.env.NEXT_PUBLIC_RASA_API_URL

    if (!rasaUrl) {
      console.error("RASA_API_URL environment variable is not set")
      return NextResponse.json({
        response: "Lo siento, hay un problema de configuración con el asistente. Por favor, contacta al administrador.",
        confidence: 0,
      })
    }

    // Send the message to Rasa
    try {
      console.log(`Sending message to Rasa at ${rasaUrl}/webhooks/rest/webhook`)

      const rasaResponse = await fetch(`${rasaUrl}/webhooks/rest/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: userId,
          message: message,
        }),
      })

      if (!rasaResponse.ok) {
        console.error(`Error from Rasa: ${rasaResponse.status} ${rasaResponse.statusText}`)
        throw new Error(`Error al comunicarse con Rasa: ${rasaResponse.statusText}`)
      }

      const rasaData = await rasaResponse.json()
      console.log("Response from Rasa:", JSON.stringify(rasaData, null, 2))

      // Check if Rasa returned any responses
      if (rasaData && rasaData.length > 0 && rasaData[0].text) {
        return NextResponse.json({
          response: rasaData[0].text,
          confidence: 0.95,
        })
      } else {
        console.warn("Rasa returned an empty or invalid response")
        return NextResponse.json({
          response: "Lo siento, no pude generar una respuesta para esa consulta. ¿Podrías reformular tu pregunta?",
          confidence: 0.5,
        })
      }
    } catch (rasaError) {
      console.error("Error communicating with Rasa:", rasaError)

      // Fallback to predefined responses if Rasa is unavailable
      let response =
        "Lo siento, estoy teniendo problemas para procesar tu consulta en este momento. ¿Podrías intentarlo más tarde?"

      // Simple keyword-based fallback responses
      if (message.toLowerCase().includes("hola") || message.toLowerCase().includes("saludos")) {
        response = "¡Hola! Soy el asistente virtual de la institución educativa. ¿En qué puedo ayudarte hoy?"
      } else if (message.toLowerCase().includes("gracias")) {
        response = "¡De nada! Estoy aquí para ayudarte."
      } else if (message.toLowerCase().includes("horario")) {
        response =
          "Los horarios de clases están disponibles en el portal estudiantil. También puedes consultar los horarios específicos de cada facultad en la sección 'Horarios' del sitio web institucional."
      }

      return NextResponse.json({
        response,
        confidence: 0.7,
      })
    }
  } catch (error) {
    console.error("Error processing chat request:", error)
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        response: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.",
      },
      { status: 500 },
    )
  }
}
