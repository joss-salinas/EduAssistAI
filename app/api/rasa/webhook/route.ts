import { NextResponse } from "next/server"
import rasaClient from "@/lib/rasa-client"

// Esta ruta API actúa como un proxy para el webhook de Rasa
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, sender = "default" } = body

    if (!message) {
      return NextResponse.json({ error: "No se proporcionó ningún mensaje" }, { status: 400 })
    }

    // Enviar el mensaje a Rasa y obtener la respuesta
    const response = await rasaClient.sendMessage(message, sender)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error al comunicarse con Rasa:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
