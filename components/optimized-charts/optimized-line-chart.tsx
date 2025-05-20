"use client"

import type React from "react"

import { useState, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Loader2 } from "lucide-react"
import { ClientOnly } from "../client-only"
import { useOptimizedChartData } from "@/hooks/use-optimized-chart-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface OptimizedLineChartProps<T extends Record<string, any>> {
  title: string
  description: string
  fetchFn: () => Promise<T[]>
  dateField: keyof T
  valueField: keyof T
  valueName: string
  color?: string
  icon?: React.ReactNode
  dateFormatter?: (date: string) => string
  valueFormatter?: (value: number) => string
  className?: string
}

// Componente de tooltip memoizado para evitar re-renderizados
const MemoizedTooltip = memo(({ active, payload, label, dateFormatter, valueFormatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-2 text-sm">
        <p className="font-medium">{dateFormatter ? dateFormatter(label) : label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
})
MemoizedTooltip.displayName = "MemoizedTooltip"

export function OptimizedLineChart<T extends Record<string, any>>({
  title,
  description,
  fetchFn,
  dateField,
  valueField,
  valueName,
  color = "#8884d8",
  icon,
  dateFormatter = (date: string) => {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
  },
  valueFormatter,
  className,
}: OptimizedLineChartProps<T>) {
  const [aggregationPeriod, setAggregationPeriod] = useState<"day" | "week" | "month">("day")

  const { data, isLoading, error } = useOptimizedChartData({
    fetchFn,
    dateField,
    valueFields: [valueField],
    aggregationPeriod,
    dependencies: [aggregationPeriod],
  })

  // Memoizar el formateador de fechas para el eje X
  const formatXAxis = useCallback(
    (dateStr: string) => {
      return dateFormatter(dateStr)
    },
    [dateFormatter],
  )

  // Memoizar el formateador de valores para el tooltip
  const formatValue = useCallback(
    (value: number) => {
      return valueFormatter ? valueFormatter(value) : value.toString()
    },
    [valueFormatter],
  )

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
          <div className="flex items-center gap-2">
            {icon && <span>{icon}</span>}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="aggregation-period">Agrupar por:</Label>
            <Select
              value={aggregationPeriod}
              onValueChange={(value: "day" | "week" | "month") => setAggregationPeriod(value)}
            >
              <SelectTrigger id="aggregation-period" className="w-[120px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
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
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <ClientOnly>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  minTickGap={30} // Evitar superposición de etiquetas
                />
                <YAxis />
                <Tooltip content={<MemoizedTooltip dateFormatter={dateFormatter} valueFormatter={formatValue} />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={valueField as string}
                  name={valueName}
                  stroke={color}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  dot={false} // Ocultar puntos para mejorar rendimiento
                  isAnimationActive={data.length < 100} // Desactivar animaciones para conjuntos grandes
                />
              </LineChart>
            </ResponsiveContainer>
          </ClientOnly>
        )}
      </CardContent>
    </Card>
  )
}
