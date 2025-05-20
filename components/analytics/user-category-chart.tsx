"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Loader2 } from "lucide-react"
import type { UserCategoryMetric } from "@/lib/analytics-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ClientOnly } from "../client-only"

export function UserCategoryChart() {
  const [data, setData] = useState<UserCategoryMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/analytics/user-category-metrics?date=${selectedDate}`)

        if (!response.ok) {
          throw new Error("Error al obtener datos por categoría de usuario")
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

  // Traducir categorías de usuario
  const translateCategory = (category: string) => {
    switch (category) {
      case "student":
        return "Estudiante"
      case "teacher":
        return "Profesor"
      case "admin":
        return "Administrador"
      default:
        return category
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
          <div>
            <CardTitle>Uso por Tipo de Usuario</CardTitle>
            <CardDescription>Métricas por categoría de usuario</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="user-date-select">Fecha:</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger id="user-date-select" className="w-[180px]">
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
              <BarChart
                data={data.map((item) => ({
                  ...item,
                  userCategory: translateCategory(item.userCategory),
                }))}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="userCategory" />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalConversations" name="Conversaciones" fill="#8884d8" />
                <Bar dataKey="avgMessagesPerConversation" name="Mensajes promedio" fill="#82ca9d" />
                <Bar dataKey="avgSatisfaction" name="Satisfacción (1-5)" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
        )}
      </CardContent>
    </Card>
  )
}
