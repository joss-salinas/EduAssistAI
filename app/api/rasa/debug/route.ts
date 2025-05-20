import { NextResponse } from "next/server"
import { checkRasaStatus } from "@/lib/rasa-status-checker"

export async function GET() {
  try {
    // Check Rasa status
    const rasaStatus = await checkRasaStatus()

    // Get environment variables (sanitized)
    const envVars = {
      RASA_API_URL: process.env.NEXT_PUBLIC_RASA_API_URL || "Not set",
      NODE_ENV: process.env.NODE_ENV || "Not set",
    }

    // Test a simple message to Rasa
    let messageTest = { success: false, response: null, error: null }

    if (rasaStatus.isRunning) {
      try {
        const rasaUrl = process.env.NEXT_PUBLIC_RASA_API_URL
        const response = await fetch(`${rasaUrl}/webhooks/rest/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: "debug_user",
            message: "hola",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          messageTest = {
            success: true,
            response: data,
            error: null,
          }
        } else {
          messageTest = {
            success: false,
            response: null,
            error: `Status ${response.status}: ${response.statusText}`,
          }
        }
      } catch (error) {
        messageTest = {
          success: false,
          response: null,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      rasaStatus,
      environment: envVars,
      messageTest,
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json(
      {
        error: "Error generating debug information",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
