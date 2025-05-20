"use server"

import { executeQuery, executeTransaction, checkDatabaseHealth } from "./db-server"
import { DatabaseError } from "./errors/database-errors"

// Función para manejar errores en acciones del servidor
async function handleServerActionError(action: string, error: unknown) {
  console.error(`Error en acción del servidor [${action}]:`, error)

  // Si es un error de base de datos conocido, devolver un mensaje específico
  if (error instanceof DatabaseError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        type: error.constructor.name,
      },
    }
  }

  // Si es un error desconocido, devolver un mensaje genérico
  return {
    success: false,
    error: {
      message: "Se produjo un error inesperado en el servidor",
      code: "UNKNOWN_ERROR",
      type: "ServerError",
    },
  }
}

// Funciones para el servicio de análisis con manejo de errores mejorado
export async function getDailyMetrics(startDate: string, endDate: string) {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        total_conversations as totalConversations,
        total_messages as totalMessages,
        avg_messages_per_conversation as avgMessagesPerConversation,
        avg_response_time_ms as avgResponseTimeMs,
        fallback_rate as fallbackRate,
        satisfaction_score as satisfactionScore
      FROM 
        conversation_metrics_daily
      WHERE 
        date BETWEEN ? AND ?
      ORDER BY 
        date ASC
    `

    const results = await executeQuery(query, [startDate, endDate])
    return { success: true, data: results }
  } catch (error) {
    return handleServerActionError("getDailyMetrics", error)
  }
}

export async function getIntentMetrics(date: string) {
  try {
    const query = `
      SELECT 
        intent_name as intentName,
        count,
        avg_confidence as avgConfidence,
        fallback_count as fallbackCount
      FROM 
        intent_metrics
      WHERE 
        date = ?
      ORDER BY 
        count DESC
    `

    const results = await executeQuery(query, [date])
    return { success: true, data: results }
  } catch (error) {
    return handleServerActionError("getIntentMetrics", error)
  }
}

export async function getKeywordFrequency(date: string, limit = 10) {
  try {
    const query = `
      SELECT 
        keyword,
        count
      FROM 
        keyword_frequency
      WHERE 
        date = ?
      ORDER BY 
        count DESC
      LIMIT ?
    `

    const results = await executeQuery(query, [date, limit])
    return { success: true, data: results }
  } catch (error) {
    return handleServerActionError("getKeywordFrequency", error)
  }
}

export async function getUserCategoryMetrics(date: string) {
  try {
    const query = `
      SELECT 
        user_category as userCategory,
        total_conversations as totalConversations,
        avg_messages_per_conversation as avgMessagesPerConversation,
        avg_satisfaction as avgSatisfaction
      FROM 
        user_category_metrics
      WHERE 
        date = ?
    `

    const results = await executeQuery(query, [date])
    return { success: true, data: results }
  } catch (error) {
    return handleServerActionError("getUserCategoryMetrics", error)
  }
}

export async function saveConversationFeedback(conversationId: number, rating: number, feedbackText?: string) {
  try {
    const query = `
      INSERT INTO conversation_feedback 
        (conversation_id, rating, feedback_text)
      VALUES 
        (?, ?, ?)
    `

    await executeQuery(query, [conversationId, rating, feedbackText || null])
    return { success: true }
  } catch (error) {
    return handleServerActionError("saveConversationFeedback", error)
  }
}

export async function startConversation(userId?: number) {
  try {
    const query = `
      INSERT INTO conversations 
        (user_id, session_id, started_at)
      VALUES 
        (?, UUID(), NOW())
    `

    const result = await executeQuery(query, [userId || null])
    return { success: true, conversationId: (result as any).insertId }
  } catch (error) {
    return handleServerActionError("startConversation", error)
  }
}

export async function endConversation(conversationId: number) {
  try {
    const query = `
      UPDATE conversations
      SET 
        ended_at = NOW()
      WHERE 
        id = ?
    `

    await executeQuery(query, [conversationId])
    return { success: true }
  } catch (error) {
    return handleServerActionError("endConversation", error)
  }
}

export async function logMessage(
  conversationId: number,
  sender: "user" | "assistant",
  message: string,
  intent?: string,
  confidence?: number,
) {
  try {
    const query = `
      INSERT INTO messages 
        (conversation_id, sender, message, intent, confidence)
      VALUES 
        (?, ?, ?, ?, ?)
    `

    await executeQuery(query, [conversationId, sender, message, intent || null, confidence || null])
    return { success: true }
  } catch (error) {
    return handleServerActionError("logMessage", error)
  }
}

// Ejemplo de uso de transacción para operaciones que necesitan consistencia
export async function saveConversationWithMessages(
  userId: number | undefined,
  messages: Array<{ sender: "user" | "assistant"; message: string; intent?: string; confidence?: number }>,
) {
  try {
    const queries = [
      {
        query: `
          INSERT INTO conversations 
            (user_id, session_id, started_at)
          VALUES 
            (?, UUID(), NOW())
        `,
        params: [userId || null],
      },
    ]

    // Esta función se ejecutará después de que todas las consultas se completen con éxito
    const processResults = (results: any[]) => {
      const conversationId = results[0].insertId
      return { success: true, conversationId }
    }

    // Ejecutar la transacción
    return await executeTransaction(queries, processResults)
  } catch (error) {
    return handleServerActionError("saveConversationWithMessages", error)
  }
}

export async function getDatabaseStatus() {
  return await checkDatabaseHealth()
}

export async function calculateDailyMetrics(date: string) {
  try {
    // Calculate metrics for the specified date
    const query = `
      INSERT INTO conversation_metrics_daily (
        date,
        total_conversations,
        total_messages,
        avg_messages_per_conversation,
        avg_response_time_ms,
        fallback_rate,
        satisfaction_score
      )
      SELECT
        DATE(c.started_at) as metric_date,
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(m.id) as total_messages,
        COUNT(m.id) / COUNT(DISTINCT c.id) as avg_messages,
        AVG(
          CASE 
            WHEN m.sender = 'assistant' AND prev.id IS NOT NULL 
            THEN TIMESTAMPDIFF(MICROSECOND, prev.created_at, m.created_at) / 1000 
            ELSE NULL 
          END
        ) as avg_response_time,
        SUM(CASE WHEN m.intent = 'nlu_fallback' THEN 1 ELSE 0 END) / COUNT(CASE WHEN m.sender = 'user' THEN 1 ELSE NULL END) as fallback_rate,
        AVG(IFNULL(cf.rating, 0)) as satisfaction
      FROM
        conversations c
      LEFT JOIN
        messages m ON c.id = m.conversation_id
      LEFT JOIN
        messages prev ON m.conversation_id = prev.conversation_id 
        AND m.sender = 'assistant' 
        AND prev.sender = 'user'
        AND prev.id = (
          SELECT MAX(id) 
          FROM messages 
          WHERE conversation_id = m.conversation_id 
          AND sender = 'user' 
          AND id < m.id
        )
      LEFT JOIN
        conversation_feedback cf ON c.id = cf.conversation_id
      WHERE
        DATE(c.started_at) = ?
      GROUP BY
        DATE(c.started_at)
      ON DUPLICATE KEY UPDATE
        total_conversations = VALUES(total_conversations),
        total_messages = VALUES(total_messages),
        avg_messages_per_conversation = VALUES(avg_messages_per_conversation),
        avg_response_time_ms = VALUES(avg_response_time_ms),
        fallback_rate = VALUES(fallback_rate),
        satisfaction_score = VALUES(satisfaction_score)
    `

    await executeQuery(query, [date])
    return { success: true }
  } catch (error) {
    return handleServerActionError("calculateDailyMetrics", error)
  }
}

export async function extractAndStoreKeywords(date: string) {
  try {
    // Extract keywords from user messages and store their frequency
    const query = `
      INSERT INTO keyword_frequency (date, keyword, count)
      WITH extracted_keywords AS (
        SELECT 
          DATE(c.started_at) as message_date,
          LOWER(TRIM(k.keyword)) as keyword
        FROM 
          conversations c
        JOIN 
          messages m ON c.id = m.conversation_id
        JOIN 
          LATERAL (
            SELECT REGEXP_SUBSTR(m.message, '[a-zA-Z]+', 1, n) as keyword
            FROM 
              (SELECT 1 + units.i + tens.i * 10 as n
               FROM 
                 (SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) units,
                 (SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens
               WHERE 1 + units.i + tens.i * 10 <= LENGTH(m.message) - LENGTH(REPLACE(m.message, ' ', '')) + 1
              ) numbers
            WHERE REGEXP_SUBSTR(m.message, '[a-zA-Z]+', 1, n) IS NOT NULL
            AND LENGTH(REGEXP_SUBSTR(m.message, '[a-zA-Z]+', 1, n)) > 3
          ) k
        WHERE 
          m.sender = 'user'
          AND DATE(c.started_at) = ?
          AND k.keyword NOT IN (
            'this', 'that', 'these', 'those', 'with', 'from', 'your', 'have', 'will',
            'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how'
          )
      )
      SELECT 
        message_date as date,
        keyword,
        COUNT(*) as count
      FROM 
        extracted_keywords
      GROUP BY 
        message_date, keyword
      ORDER BY 
        count DESC
      ON DUPLICATE KEY UPDATE
        count = VALUES(count)
    `

    await executeQuery(query, [date])
    return { success: true }
  } catch (error) {
    return handleServerActionError("extractAndStoreKeywords", error)
  }
}
