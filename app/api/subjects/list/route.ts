import { NextResponse } from "next/server"
import { SubjectAnalyticsService } from "@/lib/subject-analytics-service"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const teacherId = url.searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Se requiere el ID del profesor",
        },
        { status: 400 },
      )
    }

    const subjects = await SubjectAnalyticsService.getTeacherSubjects(Number.parseInt(teacherId))

    return NextResponse.json({
      status: "success",
      data: subjects,
    })
  } catch (error) {
    console.error("Error al obtener materias del profesor:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al obtener materias del profesor",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
