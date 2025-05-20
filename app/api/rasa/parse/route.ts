import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { safeSerialize } from "@/lib/serialization-utils"

// Define the schema for the request body
const parseTextSchema = z.object({
  text: z.string().min(1).max(1000),
})

// Define the schema for the response
const parseResponseSchema = z.object({
  intents: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      examples: z.array(z.string()),
      confidence: z.number().optional(),
      selected: z.boolean().optional(),
    }),
  ),
  entities: z.array(
    z.object({
      id: z.string().optional(),
      entity: z.string(),
      value: z.string(),
      examples: z.array(z.string()),
      selected: z.boolean().optional(),
    }),
  ),
})

export async function POST(req: NextRequest) {
  try {
    // Get the request body directly without validation middleware
    let text
    try {
      const body = await req.json()
      text = body.text

      if (!text || typeof text !== "string" || text.length < 1 || text.length > 1000) {
        return NextResponse.json(
          { error: "Texto inválido", details: "El texto debe tener entre 1 y 1000 caracteres" },
          { status: 400 },
        )
      }
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json(
        { error: "Error al parsear el cuerpo de la petición", details: "El cuerpo debe ser JSON válido" },
        { status: 400 },
      )
    }

    // Sanitize input (basic sanitization)
    const sanitizedText = text.trim()

    // Construct the Rasa API URL
    const rasaUrl = process.env.NEXT_PUBLIC_RASA_API_URL || "http://localhost:5005"
    const endpoint = `${rasaUrl}/model/parse`

    console.log(`Sending request to Rasa at ${endpoint} with text: "${sanitizedText}"`)

    // Send the request to Rasa
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: sanitizedText }),
    })

    if (!response.ok) {
      console.error(`Error from Rasa: ${response.status} ${response.statusText}`)
      throw new Error(`Error al comunicarse con Rasa: ${response.statusText}`)
    }

    // Get the response
    const rawData = await response.json()
    console.log("Raw response from Rasa:", JSON.stringify(rawData, null, 2))

    // Process and transform the response
    const processedData = {
      intents:
        rawData.intent_ranking?.map((intent: any, index: number) => ({
          id: `intent-${Date.now()}-${index}`,
          name: intent.name || "unknown",
          examples: [sanitizedText],
          confidence: typeof intent.confidence === "number" ? intent.confidence : 0,
          selected: index === 0,
        })) || [],

      entities:
        rawData.entities?.map((entity: any, index: number) => ({
          id: `entity-${Date.now()}-${index}`,
          entity: entity.entity || "unknown",
          value: entity.value || "",
          examples: [entity.value || ""],
          selected: true,
        })) || [],
    }

    // Serialize the processed data
    const serializedData = safeSerialize(processedData)

    return NextResponse.json(serializedData)
  } catch (error) {
    console.error("Error in the Rasa API:", error)
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud a Rasa",
        fallbackResponse: { intents: [], entities: [] },
      },
      { status: 500 },
    )
  }
}
