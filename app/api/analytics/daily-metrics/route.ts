import { type NextRequest, NextResponse } from "next/server"
import { getDailyMetrics } from "@/lib/server-actions"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Se requieren los parámetros startDate y endDate" }, { status: 400 })
  }

  try {
    const metrics = await getDailyMetrics(startDate, endDate)
    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error al obtener métricas diarias:", error)
    return NextResponse.json({ error: "Error al obtener métricas diarias" }, { status: 500 })
  }
}
