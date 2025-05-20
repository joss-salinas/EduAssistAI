"use client"

import type React from "react"

import { useState, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Loader2 } from "lucide-react"
import { ClientOnly } from "../client-only"
import { useOptimizedChartData } from "@/hooks/use-optimized-chart-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface OptimizedBarChartProps<T extends Record<string, any>> {
  title: string
  description: string
  fetchFn: () => Promise<T[]>
  dateField: keyof T
  valueFields: { field: keyof T; name: string; color: string }[]
  icon?: React.ReactNode
  dateFormatter?: (date: string) => string
  valueFormatter?: (value: number) => string
  className?: string
  layout?: "horizontal" | "vertical"
}

// Componente de tooltip memoizado
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

export function OptimizedBarChart<T extends Record<string, any>>({
  title,
  description,
  fetchFn,
  dateField,
  valueFields,
  icon,
  dateFormatter = (date: string) => {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
  },
  valueFormatter,
  className,
  layout = "horizontal",
}: OptimizedBarChartProps<T>) {
  const [aggregationPeriod, setAggregationPeriod] = useState<"day" | "week" | "month">("day")

  const { data, isLoading, error } = useOptimizedChartData({
    fetchFn,
    dateField,
    valueFields: valueFields.map((vf) => vf.field),
    aggregationPeriod,
    dependencies: [aggregationPeriod],
  })

  // Memoizar el formateador de fechas para el eje
  const formatAxis = useCallback(
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
            <Label htmlFor="bar-aggregation-period">Agrupar por:</Label>
            <Select
              value={aggregationPeriod}
              onValueChange={(value: "day" | "week" | "month") => setAggregationPeriod(value)}
            >
              <SelectTrigger id="bar-aggregation-period" className="w-[120px]">
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
              <BarChart
                data={data}
                layout={layout}
                margin={{ top: 10, right: 30, left: layout === "vertical" ? 100 : 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {layout === "horizontal" ? (
                  <>
                    <XAxis dataKey="date" tickFormatter={formatAxis} minTickGap={30} />
                    <YAxis />
                  </>
                ) : (
                  <>
                    <XAxis type="number" />
                    <YAxis dataKey="date" type="category" tickFormatter={formatAxis} width={100} />
                  </>
                )}
                <Tooltip content={<MemoizedTooltip dateFormatter={dateFormatter} valueFormatter={formatValue} />} />
                <Legend />
                {valueFields.map((field, index) => (
                  <Bar
                    key={field.field as string}
                    dataKey={field.field as string}
                    name={field.name}
                    fill={field.color}
                    isAnimationActive={data.length < 50} // Desactivar animaciones para conjuntos grandes
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
        )}
      </CardContent>
    </Card>
  )
}
