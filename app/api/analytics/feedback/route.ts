import { NextResponse } from "next/server"
import { AnalyticsService } from "@/lib/analytics-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { conversationId, rating, feedbackText } = body

    if (!conversationId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          status: "error",
          message: "Datos de feedback inválidos",
        },
        { status: 400 },
      )
    }

    await AnalyticsService.saveConversationFeedback({
      conversationId,
      rating,
      feedbackText,
    })

    return NextResponse.json({
      status: "success",
      message: "Feedback guardado correctamente",
    })
  } catch (error) {
    console.error("Error al guardar feedback:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al guardar feedback",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
