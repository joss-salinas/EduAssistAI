"use client"

import { TrendingUp } from "lucide-react"
import { OptimizedLineChart } from "../optimized-charts/optimized-line-chart"

interface QuestionTrendChartProps {
  subjectId: number
}

export function QuestionTrendChart({ subjectId }: QuestionTrendChartProps) {
  // Función para obtener los datos
  const fetchTrendData = async () => {
    if (!subjectId) return []

    const response = await fetch(`/api/subjects/trend?subjectId=${subjectId}`)

    if (!response.ok) {
      throw new Error("Error al obtener tendencia de preguntas")
    }

    const result = await response.json()

    if (result.status === "success") {
      return result.data
    } else {
      throw new Error(result.message || "Error desconocido")
    }
  }

  return (
    <OptimizedLineChart
      title="Tendencia de Preguntas"
      description="Evolución de preguntas sobre la materia en los últimos 30 días"
      fetchFn={fetchTrendData}
      dateField="date"
      valueField="count"
      valueName="Número de preguntas"
      color="#8884d8"
      icon={<TrendingUp className="h-5 w-5" />}
    />
  )
}
