"use client"

import { useState, useEffect, useMemo } from "react"
import { aggregateDataByTime, sampleData, simplifyLineData } from "@/lib/chart-optimization"

interface UseOptimizedChartDataOptions<T> {
  fetchFn: () => Promise<T[]>
  dateField: keyof T
  valueFields: (keyof T)[]
  aggregationPeriod?: "day" | "week" | "month"
  maxDataPoints?: number
  simplifyThreshold?: number
  dependencies?: any[]
}

export function useOptimizedChartData<T extends Record<string, any>>({
  fetchFn,
  dateField,
  valueFields,
  aggregationPeriod = "day",
  maxDataPoints = 100,
  simplifyThreshold = 1,
  dependencies = [],
}: UseOptimizedChartDataOptions<T>) {
  const [rawData, setRawData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchFn()
        setRawData(data)
        setError(null)
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies])

  // Process and optimize data
  const optimizedData = useMemo(() => {
    if (!rawData.length) return []

    // Step 1: Aggregate data by time period
    const aggregatedData = aggregateDataByTime(rawData, dateField, valueFields, aggregationPeriod)

    // Step 2: If still too many points, sample or simplify
    if (aggregatedData.length > maxDataPoints) {
      // For time series, simplify works better than sampling
      if (valueFields.length === 1) {
        return simplifyLineData(aggregatedData, "date", valueFields[0] as string, simplifyThreshold)
      } else {
        return sampleData(aggregatedData, maxDataPoints)
      }
    }

    return aggregatedData
  }, [rawData, dateField, valueFields, aggregationPeriod, maxDataPoints, simplifyThreshold])

  return { data: optimizedData, rawData, isLoading, error }
}
