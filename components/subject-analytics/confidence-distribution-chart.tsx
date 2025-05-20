"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Loader2, PieChartIcon } from "lucide-react"
import { ClientOnly } from "../client-only"

interface ConfidenceDistribution {
  confidenceRange: string
  count: number
}

interface ConfidenceDistributionChartProps {
  subjectId: number
}

const COLORS = ["#FF8042", "#FFBB28", "#00C49F", "#0088FE", "#8884D8"]

export function ConfidenceDistributionChart({ subjectId }: ConfidenceDistributionChartProps) {
  const [data, setData] = useState<ConfidenceDistribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/subjects/confidence?subjectId=${subjectId}`)

        if (!response.ok) {
          throw new Error("Error al obtener distribución de confianza")
        }

        const result = await response.json()

        if (result.status === "success") {
          setData(result.data)
        } else {
          throw new Error(result.message || "Error desconocido")
        }
      } catch (err) {
        console.error("Error al cargar distribución de confianza:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [subjectId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Distribución de Confianza
        </CardTitle>
        <CardDescription>Nivel de confianza en la clasificación de preguntas</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-destructive">Error: {error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <ClientOnly>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="confidenceRange"
                  label={({ confidenceRange, percent }) => `${confidenceRange}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} preguntas`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ClientOnly>
        )}
      </CardContent>
    </Card>
  )
}
