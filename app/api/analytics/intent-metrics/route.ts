import { NextResponse } from "next/server"
import { AnalyticsService } from "@/lib/analytics-service"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0]

    const metrics = await AnalyticsService.getIntentMetrics(date)

    return NextResponse.json({
      status: "success",
      data: metrics,
    })
  } catch (error) {
    console.error("Error al obtener métricas de intenciones:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al obtener métricas de intenciones",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
