"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, HelpCircle } from "lucide-react"
import type { DifficultQuestion } from "@/lib/subject-analytics-service"

interface DifficultQuestionsTableProps {
  subjectId: number
}

export function DifficultQuestionsTable({ subjectId }: DifficultQuestionsTableProps) {
  const [data, setData] = useState<DifficultQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/subjects/difficult-questions?subjectId=${subjectId}`)

        if (!response.ok) {
          throw new Error("Error al obtener preguntas difíciles")
        }

        const result = await response.json()

        if (result.status === "success") {
          setData(result.data)
        } else {
          throw new Error(result.message || "Error desconocido")
        }
      } catch (err) {
        console.error("Error al cargar preguntas difíciles:", err)
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
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Preguntas Difíciles
        </CardTitle>
        <CardDescription>Preguntas que el asistente no pudo responder correctamente</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">Error: {error}</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No hay preguntas difíciles registradas</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pregunta</TableHead>
                <TableHead className="w-24 text-right">Fallbacks</TableHead>
                <TableHead className="w-32">Última vez</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.question}</TableCell>
                  <TableCell className="text-right">{question.fallbackCount}</TableCell>
                  <TableCell>{formatDate(question.lastAsked)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
