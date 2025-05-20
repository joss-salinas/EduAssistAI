import { NextResponse } from "next/server"
import { AnalyticsService } from "@/lib/analytics-service"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0]
    const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10)

    const keywords = await AnalyticsService.getKeywordFrequency(date, limit)

    return NextResponse.json({
      status: "success",
      data: keywords,
    })
  } catch (error) {
    console.error("Error al obtener frecuencia de palabras clave:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al obtener frecuencia de palabras clave",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
