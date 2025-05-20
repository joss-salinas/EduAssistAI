"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Loader2 } from "lucide-react"
import type { ConversationMetrics } from "@/lib/analytics-service"
import { ClientOnly } from "../client-only"

export function ConversationVolumeChart() {
  const [data, setData] = useState<ConversationMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/analytics/daily-metrics")

        if (!response.ok) {
          throw new Error("Error al obtener datos de métricas diarias")
        }

        const result = await response.json()

        if (result.status === "success") {
          setData(result.data)
        } else {
          throw new Error(result.message || "Error desconocido")
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Formatear fecha para mostrar en el gráfico
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Volumen de Conversaciones</CardTitle>
        <CardDescription>Número de conversaciones y mensajes por día</CardDescription>
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
              <BarChart
                data={data.map((item) => ({
                  ...item,
                  date: formatDate(item.date),
                }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="totalConversations" name="Conversaciones" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="totalMessages" name="Mensajes" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
        )}
      </CardContent>
    </Card>
  )
}
