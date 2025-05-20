// Cliente para interactuar con el servidor Rasa
// Este cliente maneja todas las comunicaciones con la API de Rasa
import { safeSerialize } from "./serialization-utils"

export interface RasaMessage {
  sender: string
  message: string
}

export interface RasaResponse {
  recipient_id: string
  text?: string
  image?: string
  buttons?: Array<{
    title: string
    payload: string
  }>
  custom?: any
}

export interface RasaEntity {
  id?: string
  entity: string
  value: string
  examples: string[]
  selected?: boolean
}

export interface RasaIntent {
  id?: string
  name: string
  examples: string[]
  selected?: boolean
  confidence?: number
}

export interface RasaTrainingData {
  rasa_nlu_data: {
    common_examples: Array<{
      text: string
      intent: string
      entities?: Array<{
        start: number
        end: number
        value: string
        entity: string
      }>
    }>
    entity_synonyms?: Array<{
      value: string
      synonyms: string[]
    }>
    regex_features?: Array<{
      name: string
      pattern: string
    }>
  }
}

export interface RasaModelStatus {
  status: "training" | "ready" | "error"
  message?: string
  progress?: number
}

export class RasaClient {
  private baseUrl: string
  private apiKey: string | null

  constructor(baseUrl = process.env.NEXT_PUBLIC_RASA_API_URL || "http://localhost:5005", apiKey = null) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {})
    headers.set("Content-Type", "application/json")

    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`)
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })
  }

  // Enviar un mensaje al servidor Rasa y obtener una respuesta
  async sendMessage(message: string, userId = "default"): Promise<RasaResponse[]> {
    try {
      const response = await this.fetchWithAuth("/webhooks/rest/webhook", {
        method: "POST",
        body: JSON.stringify({
          sender: userId,
          message,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al enviar mensaje: ${response.statusText}`)
      }

      const data = await response.json()
      // Serializar los datos para asegurar que sean compatibles con Next.js
      return safeSerialize(data) as RasaResponse[]
    } catch (error) {
      console.error("Error al enviar mensaje a Rasa:", error)
      throw error
    }
  }

  // Extraer intenciones y entidades de un texto
  async extractIntentsAndEntities(text: string): Promise<{ intents: RasaIntent[]; entities: RasaEntity[] }> {
    try {
      const response = await this.fetchWithAuth("/model/parse", {
        method: "POST",
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`Error al extraer intenciones y entidades: ${response.statusText}`)
      }

      const data = await response.json()

      // Procesar intenciones
      const intents: RasaIntent[] = data.intent_ranking.map((intent: any, index: number) => ({
        id: `intent-${Date.now()}-${index}`,
        name: intent.name,
        examples: [text],
        confidence: intent.confidence,
        selected: index === 0, // Seleccionar por defecto la intención con mayor confianza
      }))

      // Procesar entidades
      const entities: RasaEntity[] = data.entities.map((entity: any, index: number) => ({
        id: `entity-${Date.now()}-${index}`,
        entity: entity.entity,
        value: entity.value,
        examples: [entity.value],
        selected: true,
      }))

      // Serializar los datos para asegurar que sean compatibles con Next.js
      return safeSerialize({ intents, entities }) as { intents: RasaIntent[]; entities: RasaEntity[] }
    } catch (error) {
      console.error("Error al extraer intenciones y entidades:", error)
      throw error
    }
  }

  // Extraer texto de un documento (PDF, DOCX, TXT)
  async extractTextFromDocument(file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${this.baseUrl}/extract-text`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error al extraer texto del documento: ${response.statusText}`)
      }

      const data = await response.json()
      return safeSerialize(data.text) as string
    } catch (error) {
      console.error("Error al extraer texto del documento:", error)
      throw error
    }
  }

  // Preparar datos de entrenamiento en formato Rasa NLU
  prepareTrainingData(intents: RasaIntent[], entities: RasaEntity[]): RasaTrainingData {
    const examples: any[] = []

    // Procesar intenciones y sus ejemplos
    intents.forEach((intent) => {
      if (!intent.selected) return

      intent.examples.forEach((example) => {
        const exampleObj: any = {
          text: example,
          intent: intent.name,
        }

        // Buscar entidades en este ejemplo
        const exampleEntities: any[] = []
        entities.forEach((entity) => {
          if (!entity.selected) return

          entity.examples.forEach((entityExample) => {
            const start = example.indexOf(entityExample)
            if (start >= 0) {
              exampleEntities.push({
                start,
                end: start + entityExample.length,
                value: entityExample,
                entity: entity.entity,
              })
            }
          })
        })

        if (exampleEntities.length > 0) {
          exampleObj.entities = exampleEntities
        }

        examples.push(exampleObj)
      })
    })

    // Preparar sinónimos de entidades
    const entitySynonyms = entities
      .filter((entity) => entity.selected && entity.examples.length > 1)
      .map((entity) => ({
        value: entity.value,
        synonyms: entity.examples,
      }))

    // Serializar los datos para asegurar que sean compatibles con Next.js
    return safeSerialize({
      rasa_nlu_data: {
        common_examples: examples,
        entity_synonyms: entitySynonyms,
        regex_features: [],
      },
    }) as RasaTrainingData
  }

  // Enviar datos de entrenamiento al servidor Rasa
  async trainModel(trainingData: RasaTrainingData): Promise<{ message: string }> {
    try {
      const response = await this.fetchWithAuth("/model/train", {
        method: "POST",
        body: JSON.stringify(trainingData),
      })

      if (!response.ok) {
        throw new Error(`Error al entrenar el modelo: ${response.statusText}`)
      }

      const data = await response.json()
      return safeSerialize(data) as { message: string }
    } catch (error) {
      console.error("Error al entrenar el modelo de Rasa:", error)
      throw error
    }
  }

  // Verificar el estado del entrenamiento
  async getTrainingStatus(): Promise<RasaModelStatus> {
    try {
      const response = await this.fetchWithAuth("/status", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error(`Error al obtener el estado del entrenamiento: ${response.statusText}`)
      }

      const data = await response.json()

      // Mapear la respuesta al formato que esperamos
      let status: RasaModelStatus["status"] = "ready"

      if (data.status === "training") {
        status = "training"
      } else if (data.status === "failed") {
        status = "error"
      }

      // Serializar los datos para asegurar que sean compatibles con Next.js
      return safeSerialize({
        status,
        message: data.message || "",
        progress: data.progress || 0,
      }) as RasaModelStatus
    } catch (error) {
      console.error("Error al obtener el estado del entrenamiento:", error)
      throw error
    }
  }
}

// Exportar una instancia por defecto del cliente
const rasaClient = new RasaClient()
export default rasaClient
