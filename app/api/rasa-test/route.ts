import { NextResponse } from "next/server"
import rasaClient from "@/lib/rasa-client"

export async function GET() {
  try {
    // Intentar obtener el estado del servidor Rasa
    const status = await rasaClient.getTrainingStatus()

    return NextResponse.json({
      status: "success",
      message: "Conexión a Rasa establecida correctamente",
      rasaStatus: status,
    })
  } catch (error) {
    console.error("Error al conectar con Rasa:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al conectar con Rasa",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
