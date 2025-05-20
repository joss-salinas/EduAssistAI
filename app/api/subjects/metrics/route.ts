import { NextResponse } from "next/server"
import { SubjectAnalyticsService } from "@/lib/subject-analytics-service"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const subjectId = url.searchParams.get("subjectId")
    const startDate =
      url.searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const endDate = url.searchParams.get("endDate") || new Date().toISOString().split("T")[0]

    if (!subjectId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Se requiere el ID de la materia",
        },
        { status: 400 },
      )
    }

    const metrics = await SubjectAnalyticsService.getSubjectQuestionMetrics(
      Number.parseInt(subjectId),
      startDate,
      endDate,
    )

    return NextResponse.json({
      status: "success",
      data: metrics,
    })
  } catch (error) {
    console.error("Error al obtener métricas de la materia:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al obtener métricas de la materia",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
