"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { KeywordFrequency } from "@/lib/analytics-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function KeywordCloud() {
  const [data, setData] = useState<KeywordFrequency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/analytics/keyword-frequency?date=${selectedDate}&limit=30`)

        if (!response.ok) {
          throw new Error("Error al obtener datos de palabras clave")
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

  // Calcular tamaño de fuente basado en la frecuencia
  const getFontSize = (count: number) => {
    const maxCount = Math.max(...data.map((item) => item.count))
    const minCount = Math.min(...data.map((item) => item.count))
    const range = maxCount - minCount
    const normalizedCount = range === 0 ? 1 : (count - minCount) / range
    return 1 + normalizedCount * 2 // Tamaño entre 1rem y 3rem
  }

  // Obtener un color basado en la frecuencia
  const getColor = (count: number) => {
    const maxCount = Math.max(...data.map((item) => item.count))
    const minCount = Math.min(...data.map((item) => item.count))
    const range = maxCount - minCount
    const normalizedCount = range === 0 ? 1 : (count - minCount) / range

    // Colores desde azul claro hasta azul oscuro
    const hue = 210 // Azul
    const saturation = 80
    const lightness = 70 - normalizedCount * 40 // Desde 70% hasta 30% de luminosidad

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
          <div>
            <CardTitle>Nube de Palabras Clave</CardTitle>
            <CardDescription>Palabras más frecuentes en las consultas</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="keyword-date-select">Fecha:</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger id="keyword-date-select" className="w-[180px]">
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
          <div className="flex h-full flex-wrap items-center justify-center gap-4 overflow-auto p-4">
            {data.map((item, index) => (
              <span
                key={index}
                className="inline-block transition-transform hover:scale-110"
                style={{
                  fontSize: `${getFontSize(item.count)}rem`,
                  color: getColor(item.count),
                  fontWeight: item.count > data[0].count / 2 ? "bold" : "normal",
                }}
                title={`${item.keyword}: ${item.count} veces`}
              >
                {item.keyword}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
