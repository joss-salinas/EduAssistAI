"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Loader2 } from "lucide-react"
import type { IntentMetric } from "@/lib/analytics-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ClientOnly } from "../client-only"

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#8DD1E1",
  "#A4DE6C",
  "#D0ED57",
]

export function IntentDistributionChart() {
  const [data, setData] = useState<IntentMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/analytics/intent-metrics?date=${selectedDate}`)

        if (!response.ok) {
          throw new Error("Error al obtener datos de intenciones")
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
  }, [selectedDate])

  // Generar fechas para el selector (últimos 7 días)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split("T")[0]
  })

  // Formatear fecha para mostrar en el selector
  const formatDateOption = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
          <div>
            <CardTitle>Distribución de Intenciones</CardTitle>
            <CardDescription>Frecuencia de intenciones detectadas</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="date-select">Fecha:</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger id="date-select" className="w-[180px]">
                <SelectValue placeholder="Seleccionar fecha" />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatDateOption(date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
            <p className="text-muted-foreground">No hay datos disponibles para esta fecha</p>
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
                  nameKey="intentName"
                  label={({ intentName, percent }) => `${intentName}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} consultas`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ClientOnly>
        )}
      </CardContent>
    </Card>
  )
}
