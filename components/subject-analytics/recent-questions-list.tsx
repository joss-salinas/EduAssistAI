"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MessageSquare } from "lucide-react"

interface RecentQuestion {
  question: string
  timestamp: string
}

interface RecentQuestionsListProps {
  subjectId: number
}

export function RecentQuestionsList({ subjectId }: RecentQuestionsListProps) {
  const [data, setData] = useState<RecentQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/subjects/recent-questions?subjectId=${subjectId}`)

        if (!response.ok) {
          throw new Error("Error al obtener preguntas recientes")
        }

        const result = await response.json()

        if (result.status === "success") {
          setData(result.data)
        } else {
          throw new Error(result.message || "Error desconocido")
        }
      } catch (err) {
        console.error("Error al cargar preguntas recientes:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [subjectId])

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return (
      date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }) +
      " " +
      date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Preguntas Recientes
        </CardTitle>
        <CardDescription>Últimas preguntas realizadas sobre esta materia</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">Error: {error}</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No hay preguntas recientes</div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
