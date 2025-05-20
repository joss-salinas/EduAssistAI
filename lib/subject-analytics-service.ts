import { executeQuery } from "@/lib/db"

export interface SubjectInfo {
  id: number
  name: string
  code: string
  description?: string
  isCoordinator?: boolean
}

export interface SubjectQuestionMetric {
  date: string
  subjectId: number
  subjectName: string
  totalQuestions: number
  avgConfidence: number
  fallbackCount: number
}

export interface SubjectTopic {
  subjectId: number
  topic: string
  count: number
  lastAsked: string
}

export interface DifficultQuestion {
  id: number
  subjectId: number
  question: string
  fallbackCount: number
  lastAsked: string
}

export interface QuestionTrend {
  date: string
  count: number
}

export class SubjectAnalyticsService {
  // Obtener materias asignadas a un profesor
  static async getTeacherSubjects(teacherId: number): Promise<SubjectInfo[]> {
    const query = `
      SELECT 
        s.id,
        s.name,
        s.code,
        s.description,
        ts.is_coordinator as isCoordinator
      FROM 
        subjects s
      JOIN 
        teacher_subjects ts ON s.id = ts.subject_id
      WHERE 
        ts.teacher_id = ?
      ORDER BY 
        s.name ASC
    `

    try {
      const results = await executeQuery(query, [teacherId])
      return results as SubjectInfo[]
    } catch (error) {
      console.error("Error al obtener materias del profesor:", error)
      throw error
    }
  }

  // Obtener métricas de preguntas por materia para un rango de fechas
  static async getSubjectQuestionMetrics(
    subjectId: number,
    startDate: string,
    endDate: string,
  ): Promise<SubjectQuestionMetric[]> {
    const query = `
      SELECT 
        DATE_FORMAT(sqm.date, '%Y-%m-%d') as date,
        sqm.subject_id as subjectId,
        s.name as subjectName,
        sqm.total_questions as totalQuestions,
        sqm.avg_confidence as avgConfidence,
        sqm.fallback_count as fallbackCount
      FROM 
        subject_question_metrics sqm
      JOIN
        subjects s ON sqm.subject_id = s.id
      WHERE 
        sqm.subject_id = ? AND
        sqm.date BETWEEN ? AND ?
      ORDER BY 
        sqm.date ASC
    `

    try {
      const results = await executeQuery(query, [subjectId, startDate, endDate])
      return results as SubjectQuestionMetric[]
    } catch (error) {
      console.error("Error al obtener métricas de preguntas por materia:", error)
      throw error
    }
  }

  // Obtener temas frecuentes por materia
  static async getSubjectTopics(subjectId: number, limit = 10): Promise<SubjectTopic[]> {
    const query = `
      SELECT 
        subject_id as subjectId,
        topic,
        count,
        DATE_FORMAT(last_asked, '%Y-%m-%d %H:%i:%s') as lastAsked
      FROM 
        subject_topics
      WHERE 
        subject_id = ?
      ORDER BY 
        count DESC
      LIMIT ?
    `

    try {
      const results = await executeQuery(query, [subjectId, limit])
      return results as SubjectTopic[]
    } catch (error) {
      console.error("Error al obtener temas frecuentes por materia:", error)
      throw error
    }
  }

  // Obtener preguntas difíciles por materia
  static async getDifficultQuestions(subjectId: number, limit = 10): Promise<DifficultQuestion[]> {
    const query = `
      SELECT 
        id,
        subject_id as subjectId,
        question,
        fallback_count as fallbackCount,
        DATE_FORMAT(last_asked, '%Y-%m-%d %H:%i:%s') as lastAsked
      FROM 
        difficult_questions
      WHERE 
        subject_id = ?
      ORDER BY 
        fallback_count DESC
      LIMIT ?
    `

    try {
      const results = await executeQuery(query, [subjectId, limit])
      return results as DifficultQuestion[]
    } catch (error) {
      console.error("Error al obtener preguntas difíciles por materia:", error)
      throw error
    }
  }

  // Obtener tendencia de preguntas por materia (últimos 30 días)
  static async getQuestionTrend(subjectId: number): Promise<QuestionTrend[]> {
    const query = `
      SELECT 
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        total_questions as count
      FROM 
        subject_question_metrics
      WHERE 
        subject_id = ? AND
        date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY 
        date ASC
    `

    try {
      const results = await executeQuery(query, [subjectId])
      return results as QuestionTrend[]
    } catch (error) {
      console.error("Error al obtener tendencia de preguntas:", error)
      throw error
    }
  }

  // Obtener ejemplos de preguntas recientes por materia
  static async getRecentQuestions(subjectId: number, limit = 10): Promise<{ question: string; timestamp: string }[]> {
    const query = `
      SELECT 
        m.message as question,
        DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as timestamp
      FROM 
        messages m
      JOIN
        message_subjects ms ON m.id = ms.message_id
      WHERE 
        ms.subject_id = ? AND
        m.sender = 'user'
      ORDER BY 
        m.created_at DESC
      LIMIT ?
    `

    try {
      const results = await executeQuery(query, [subjectId, limit])
      return results as { question: string; timestamp: string }[]
    } catch (error) {
      console.error("Error al obtener preguntas recientes:", error)
      throw error
    }
  }

  // Obtener distribución de confianza para una materia
  static async getConfidenceDistribution(subjectId: number): Promise<{ confidenceRange: string; count: number }[]> {
    const query = `
      SELECT 
        CASE
          WHEN confidence < 0.2 THEN 'Muy baja (0-20%)'
          WHEN confidence < 0.4 THEN 'Baja (20-40%)'
          WHEN confidence < 0.6 THEN 'Media (40-60%)'
          WHEN confidence < 0.8 THEN 'Alta (60-80%)'
          ELSE 'Muy alta (80-100%)'
        END as confidenceRange,
        COUNT(*) as count
      FROM 
        message_subjects
      WHERE 
        subject_id = ?
      GROUP BY 
        confidenceRange
      ORDER BY 
        MIN(confidence)
    `

    try {
      const results = await executeQuery(query, [subjectId])
      return results as { confidenceRange: string; count: number }[]
    } catch (error) {
      console.error("Error al obtener distribución de confianza:", error)
      throw error
    }
  }

  // Añadir un tema a una materia
  static async addSubjectTopic(subjectId: number, topic: string): Promise<void> {
    const query = `
      INSERT INTO subject_topics 
        (subject_id, topic, count, last_asked)
      VALUES 
        (?, ?, 1, NOW())
      ON DUPLICATE KEY UPDATE
        count = count + 1,
        last_asked = NOW()
    `

    try {
      await executeQuery(query, [subjectId, topic])
    } catch (error) {
      console.error("Error al añadir tema a materia:", error)
      throw error
    }
  }

  // Añadir una pregunta difícil
  static async addDifficultQuestion(subjectId: number, question: string): Promise<void> {
    const query = `
      INSERT INTO difficult_questions 
        (subject_id, question, fallback_count, last_asked)
      VALUES 
        (?, ?, 1, NOW())
      ON DUPLICATE KEY UPDATE
        fallback_count = fallback_count + 1,
        last_asked = NOW()
    `

    try {
      await executeQuery(query, [subjectId, question])
    } catch (error) {
      console.error("Error al añadir pregunta difícil:", error)
      throw error
    }
  }

  // Clasificar un mensaje por materia
  static async classifyMessageBySubject(messageId: number, messageText: string): Promise<void> {
    const query = `CALL classify_message_by_subject(?, ?)`

    try {
      await executeQuery(query, [messageId, messageText])
    } catch (error) {
      console.error("Error al clasificar mensaje por materia:", error)
      throw error
    }
  }
}
