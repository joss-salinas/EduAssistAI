import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // Intentar ejecutar una consulta simple
    const result = await executeQuery("SELECT 1 as test")

    return NextResponse.json({
      status: "success",
      message: "Conexión a MySQL establecida correctamente",
      data: result,
    })
  } catch (error) {
    console.error("Error al conectar con MySQL:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al conectar con MySQL",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
