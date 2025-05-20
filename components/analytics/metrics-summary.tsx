"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { ConversationMetrics } from "@/lib/analytics-service"
import { MessageSquare, Clock, AlertTriangle, ThumbsUp } from "lucide-react"

export function MetricsSummary() {
  const [data, setData] = useState<ConversationMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const today = new Date().toISOString().split("T")[0]
        const response = await fetch(`/api/analytics/daily-metrics?startDate=${today}&endDate=${today}`)

        if (!response.ok) {
          throw new Error("Error al obtener datos de métricas diarias")
        }

        const result = await response.json()

        if (result.status === "success" && result.data.length > 0) {
          setData(result.data[0])
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const metrics = [
    {
      title: "Conversaciones",
      value: data?.totalConversations || 0,
      icon: <MessageSquare className="h-4 w-4 text-primary" />,
    },
    {
      title: "Tiempo de Respuesta",
      value: data ? `${data.avgResponseTimeMs.toFixed(0)} ms` : "-",
      icon: <Clock className="h-4 w-4 text-primary" />,
    },
    {
      title: "Tasa de Fallback",
      value: data ? `${(data.fallbackRate * 100).toFixed(1)}%` : "-",
      icon: <AlertTriangle className="h-4 w-4 text-primary" />,
    },
    {
      title: "Satisfacción",
      value: data ? `${data.satisfactionScore.toFixed(1)}/5` : "-",
      icon: <ThumbsUp className="h-4 w-4 text-primary" />,
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
