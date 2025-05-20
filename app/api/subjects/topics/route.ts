import { NextResponse } from "next/server"
import { SubjectAnalyticsService } from "@/lib/subject-analytics-service"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const subjectId = url.searchParams.get("subjectId")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10)

    if (!subjectId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Se requiere el ID de la materia",
        },
        { status: 400 },
      )
    }

    const topics = await SubjectAnalyticsService.getSubjectTopics(Number.parseInt(subjectId), limit)

    return NextResponse.json({
      status: "success",
      data: topics,
    })
  } catch (error) {
    console.error("Error al obtener temas de la materia:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al obtener temas de la materia",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
