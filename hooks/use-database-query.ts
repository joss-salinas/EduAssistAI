"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface Options<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
  retryCount?: number
  retryInterval?: number
}

interface QueryResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

export function useDatabaseQuery<T>(queryFn: () => Promise<T>, options: Options<T> = {}): QueryResult<T> {
  const { onSuccess, onError, enabled = true, retryCount = 3, retryInterval = 1000 } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [retries, setRetries] = useState(0)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      setData(result)
      setRetries(0) // Resetear los reintentos tras éxito
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))

      // Verificar si debemos reintentar
      if (retries < retryCount) {
        // Incrementar contador de reintentos
        setRetries((prev) => prev + 1)

        // Programar reintento
        const timeoutId = setTimeout(() => {
          fetchData()
        }, retryInterval * Math.pow(2, retries)) // Backoff exponencial

        return () => clearTimeout(timeoutId)
      }

      // Si hemos agotado los reintentos, establecer el error
      setError(error)
      onError?.(error)

      // Mostrar toast de error solo después de agotar reintentos
      toast({
        variant: "destructive",
        title: "Error de base de datos",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [queryFn, retries, retryCount, retryInterval, onSuccess, onError, toast])

  // Efecto para ejecutar la consulta
  useEffect(() => {
    if (enabled) {
      fetchData()
    }

    // Limpiar en desmontaje
    return () => {
      // Si hay alguna limpieza necesaria
    }
  }, [enabled, fetchData])

  // Función para volver a ejecutar la consulta manualmente
  const refetch = useCallback(async () => {
    setRetries(0) // Resetear reintentos al refrescar manualmente
    await fetchData()
  }, [fetchData])

  return { data, error, isLoading, isError: !!error, refetch }
}
