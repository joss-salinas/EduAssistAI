/**
 * Utility to check if the Rasa server is running and properly configured
 */
export async function checkRasaStatus(): Promise<{
  isRunning: boolean
  version?: string
  error?: string
}> {
  try {
    const rasaUrl = process.env.NEXT_PUBLIC_RASA_API_URL

    if (!rasaUrl) {
      return {
        isRunning: false,
        error: "RASA_API_URL environment variable is not set",
      }
    }

    const response = await fetch(`${rasaUrl}/version`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return {
        isRunning: false,
        error: `Rasa server returned status ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()

    return {
      isRunning: true,
      version: data.version || "Unknown",
    }
  } catch (error) {
    console.error("Error checking Rasa status:", error)
    return {
      isRunning: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
