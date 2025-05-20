"use client"

import {
  getDailyMetrics,
  getIntentMetrics,
  getKeywordFrequency,
  getUserCategoryMetrics,
  saveConversationFeedback as saveFeedback,
  startConversation as startConv,
  endConversation as endConv,
  logMessage as logMsg,
  calculateDailyMetrics as calcDailyMetrics,
  getDatabaseStatus,
} from "./server-actions"

export interface ConversationMetrics {
  date: string
  totalConversations: number
  totalMessages: number
  avgMessagesPerConversation: number
  avgResponseTimeMs: number
  fallbackRate: number
  satisfactionScore: number
}

export interface IntentMetric {
  intentName: string
  count: number
  avgConfidence: number
  fallbackCount: number
}

export interface KeywordFrequency {
  keyword: string
  count: number
}

export interface UserCategoryMetric {
  userCategory: string
  totalConversations: number
  avgMessagesPerConversation: number
  avgSatisfaction: number
}

export interface ConversationFeedback {
  conversationId: number
  rating: number
  feedbackText?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    type: string
  }
}

export class AnalyticsService {
  // Helper method para manejar errores
  private static handleError(error: any, action: string): never {
    console.error(`Error en AnalyticsService.${action}:`, error)

    const errorMessage = error?.error?.message || "Error inesperado en el servicio de análisis"
    const errorCode = error?.error?.code || "UNKNOWN_ERROR"
    const errorType = error?.error?.type || "ServiceError"

    throw new Error(`[${errorCode}] ${errorMessage}`)
  }

  // Comprobar el estado de la base de datos
  static async checkDatabaseStatus() {
    try {
      return await getDatabaseStatus()
    } catch (error) {
      console.error("Error al comprobar el estado de la base de datos:", error)
      return {
        status: "unhealthy",
        message: "No se pudo comprobar el estado de la base de datos",
        error: "CONNECTION_ERROR",
      }
    }
  }

  // Obtener métricas diarias para un rango de fechas
  static async getDailyMetrics(startDate: string, endDate: string): Promise<ConversationMetrics[]> {
    try {
      const response = await getDailyMetrics(startDate, endDate)

      if (!response.success) {
        this.handleError(response, "getDailyMetrics")
      }

      return response.data as ConversationMetrics[]
    } catch (error) {
      this.handleError(error, "getDailyMetrics")
    }
  }

  // Obtener métricas de intenciones para una fecha específica
  static async getIntentMetrics(date: string): Promise<IntentMetric[]> {
    try {
      const response = await getIntentMetrics(date)

      if (!response.success) {
        this.handleError(response, "getIntentMetrics")
      }

      return response.data as IntentMetric[]
    } catch (error) {
      this.handleError(error, "getIntentMetrics")
    }
  }

  // Obtener frecuencia de palabras clave para una fecha específica
  static async getKeywordFrequency(date: string, limit = 10): Promise<KeywordFrequency[]> {
    try {
      const response = await getKeywordFrequency(date, limit)

      if (!response.success) {
        this.handleError(response, "getKeywordFrequency")
      }

      return response.data as KeywordFrequency[]
    } catch (error) {
      this.handleError(error, "getKeywordFrequency")
    }
  }

  // Obtener métricas por categoría de usuario para una fecha específica
  static async getUserCategoryMetrics(date: string): Promise<UserCategoryMetric[]> {
    try {
      const response = await getUserCategoryMetrics(date)

      if (!response.success) {
        this.handleError(response, "getUserCategoryMetrics")
      }

      return response.data as UserCategoryMetric[]
    } catch (error) {
      this.handleError(error, "getUserCategoryMetrics")
    }
  }

  // Guardar feedback de una conversación
  static async saveConversationFeedback(feedback: ConversationFeedback): Promise<void> {
    try {
      const response = await saveFeedback(feedback.conversationId, feedback.rating, feedback.feedbackText)

      if (!response.success) {
        this.handleError(response, "saveConversationFeedback")
      }
    } catch (error) {
      this.handleError(error, "saveConversationFeedback")
    }
  }

  // Registrar una nueva conversación
  static async startConversation(userId?: number): Promise<number> {
    try {
      const response = await startConv(userId)

      if (!response.success) {
        this.handleError(response, "startConversation")
      }

      return response.conversationId
    } catch (error) {
      this.handleError(error, "startConversation")
    }
  }

  // Finalizar una conversación
  static async endConversation(conversationId: number): Promise<void> {
    try {
      const response = await endConv(conversationId)

      if (!response.success) {
        this.handleError(response, "endConversation")
      }
    } catch (error) {
      this.handleError(error, "endConversation")
    }
  }

  // Registrar un mensaje en una conversación
  static async logMessage(
    conversationId: number,
    sender: "user" | "assistant",
    message: string,
    intent?: string,
    confidence?: number,
  ): Promise<void> {
    try {
      const response = await logMsg(conversationId, sender, message, intent, confidence)

      if (!response.success) {
        this.handleError(response, "logMessage")
      }
    } catch (error) {
      this.handleError(error, "logMessage")
    }
  }

  // Calcular métricas diarias para una fecha específica
  static async calculateDailyMetrics(date: string): Promise<void> {
    try {
      const response = await calcDailyMetrics(date)

      if (!response.success) {
        this.handleError(response, "calculateDailyMetrics")
      }
    } catch (error) {
      this.handleError(error, "calculateDailyMetrics")
    }
  }
}
