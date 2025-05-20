"use client"

import { ListFilter } from "lucide-react"
import { useState, useEffect } from "react"
import type { SubjectTopic } from "@/lib/subject-analytics-service"
import { OptimizedPieChart } from "../optimized-charts/optimized-pie-chart"

interface TopicFrequencyChartProps {
  subjectId: number
}

export function TopicFrequencyChart({ subjectId }: TopicFrequencyChartProps) {
  const [data, setData] = useState<SubjectTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/subjects/topics?subjectId=${subjectId}`)

        if (!response.ok) {
          throw new Error("Error al obtener temas frecuentes")
        }

        const result = await response.json()

        if (result.status === "success") {
          setData(result.data)
        } else {
          throw new Error(result.message || "Error desconocido")
        }
      } catch (err) {
        console.error("Error al cargar temas:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [subjectId])

  return (
    <OptimizedPieChart
      title="Temas Más Consultados"
      description="Frecuencia de temas consultados en esta materia"
      data={data}
      isLoading={isLoading}
      error={error}
      nameKey="topic"
      dataKey="count"
      icon={<ListFilter className="h-5 w-5" />}
      maxSlices={8}
    />
  )
}
