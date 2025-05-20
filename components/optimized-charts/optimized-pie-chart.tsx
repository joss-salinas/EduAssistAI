"use client"

import type React from "react"

import { useState, memo, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Loader2 } from "lucide-react"
import { ClientOnly } from "../client-only"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface OptimizedPieChartProps<T extends Record<string, any>> {
  title: string
  description: string
  data: T[]
  isLoading: boolean
  error: string | null
  nameKey: keyof T
  dataKey: keyof T
  colors?: string[]
  icon?: React.ReactNode
  valueFormatter?: (value: number) => string
  className?: string
  maxSlices?: number
}

// Colores predeterminados
const DEFAULT_COLORS = [
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

// Componente de tooltip memoizado
const MemoizedTooltip = memo(({ active, payload, valueFormatter }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0]
    return (
      <div className="bg-background border rounded-md shadow-md p-2 text-sm">
        <p className="font-medium" style={{ color: entry.color }}>
          {entry.name}
        </p>
        <p>{valueFormatter ? valueFormatter(entry.value) : entry.value}</p>
        <p>{`${(entry.percent * 100).toFixed(1)}%`}</p>
      </div>
    )
  }
  return null
})
MemoizedTooltip.displayName = "MemoizedTooltip"

// Componente de etiqueta memoizado
const MemoizedLabel = memo(({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  // Solo mostrar etiquetas para segmentos grandes (más del 5%)
  if (percent < 0.05) return null

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize="12">
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  )
})
MemoizedLabel.displayName = "MemoizedLabel"

export function OptimizedPieChart<T extends Record<string, any>>({
  title,
  description,
  data,
  isLoading,
  error,
  nameKey,
  dataKey,
  colors = DEFAULT_COLORS,
  icon,
  valueFormatter = (value: number) => value.toString(),
  className,
  maxSlices = 10,
}: OptimizedPieChartProps<T>) {
  const [showOthers, setShowOthers] = useState<boolean>(true)

  // Optimizar los datos para el gráfico circular
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Si hay menos elementos que el máximo, mostrar todos
    if (data.length <= maxSlices || !showOthers) return data

    // Ordenar por valor descendente
    const sortedData = [...data].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey]))

    // Tomar los N principales elementos
    const topItems = sortedData.slice(0, maxSlices - 1)

    // Agrupar el resto en "Otros"
    const otherItems = sortedData.slice(maxSlices - 1)
    const otherValue = otherItems.reduce((sum, item) => sum + Number(item[dataKey]), 0)

    // Crear un elemento "Otros"
    const otherItem: Record<string, any> = {}
    otherItem[nameKey as string] = "Otros"
    otherItem[dataKey as string] = otherValue

    return [...topItems, otherItem as T]
  }, [data, nameKey, dataKey, maxSlices, showOthers])

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
          {data && data.length > maxSlices && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-others">Mostrar:</Label>
              <Select
                value={showOthers ? "grouped" : "all"}
                onValueChange={(value) => setShowOthers(value === "grouped")}
              >
                <SelectTrigger id="show-others" className="w-[150px]">
                  <SelectValue placeholder="Visualización" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grouped">Agrupar otros</SelectItem>
                  <SelectItem value="all">Mostrar todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
        ) : optimizedData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <ClientOnly>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={optimizedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey={dataKey as string}
                  nameKey={nameKey as string}
                  label={<MemoizedLabel />}
                  isAnimationActive={optimizedData.length < 20}
                >
                  {optimizedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<MemoizedTooltip valueFormatter={valueFormatter} />} />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ClientOnly>
        )}
      </CardContent>
    </Card>
  )
}
