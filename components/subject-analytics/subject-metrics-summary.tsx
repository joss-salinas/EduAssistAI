"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, AlertTriangle, Clock, ThumbsUp } from "lucide-react"
import type { SubjectQuestionMetric } from "@/lib/subject-analytics-service"

interface SubjectMetricsSummaryProps {
  subjectId: number
}

export function SubjectMetricsSummary({ subjectId }: SubjectMetricsSummaryProps) {
  const [data, setData] = useState<SubjectQuestionMetric | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return

      try {
        setIsLoading(true)
        const today = new Date().toISOString().split("T")[0]
        const response = await fetch(`/api/subjects/metrics?subjectId=${subjectId}&startDate=${today}&endDate=${today}`)

        if (!response.ok) {
          throw new Error("Error al obtener métricas de la materia")
        }

        const result = await response.json()

        if (result.status === "success" && result.data.length > 0) {
          setData(result.data[0])
        }
      } catch (err) {
        console.error("Error al cargar métricas:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [subjectId])

  const metrics = [
    {
      title: "Preguntas Hoy",
      value: data?.totalQuestions || 0,
      icon: <MessageSquare className="h-4 w-4 text-primary" />,
    },
    {
      title: "Confianza Promedio",
      value: data ? `${(data.avgConfidence * 100).toFixed(0)}%` : "-",
      icon: <ThumbsUp className="h-4 w-4 text-primary" />,
    },
    {
      title: "Fallbacks",
      value: data?.fallbackCount || 0,
      icon: <AlertTriangle className="h-4 w-4 text-primary" />,
    },
    {
      title: "Última Actualización",
      value: data ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
      icon: <Clock className="h-4 w-4 text-primary" />,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-primary/10 p-2">{metric.icon}</div>
            <h3 className="text-sm font-medium text-muted-foreground">{metric.title}</h3>
            <p className="text-2xl font-bold">
              {isLoading ? <span className="animate-pulse">...</span> : metric.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
