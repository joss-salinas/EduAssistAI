import { NextResponse } from "next/server"
import { SubjectAnalyticsService } from "@/lib/subject-analytics-service"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const subjectId = url.searchParams.get("subjectId")

    if (!subjectId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Se requiere el ID de la materia",
        },
        { status: 400 },
      )
    }

    const trend = await SubjectAnalyticsService.getQuestionTrend(Number.parseInt(subjectId))

    return NextResponse.json({
      status: "success",
      data: trend,
    })
  } catch (error) {
    console.error("Error al obtener tendencia de preguntas:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al obtener tendencia de preguntas",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
