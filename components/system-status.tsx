"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Database, Cloud } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnalyticsService } from "@/lib/analytics-service"
import { DatabaseError } from "@/components/ui/database-error"

interface SystemStatus {
  database: {
    status: "healthy" | "unhealthy" | "checking"
    message: string
    error?: string
  }
  rasa: {
    status: "healthy" | "unhealthy" | "checking"
    message: string
    error?: string
  }
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    database: {
      status: "checking",
      message: "Comprobando conexión a la base de datos...",
    },
    rasa: {
      status: "checking",
      message: "Comprobando conexión al servidor Rasa...",
    },
  })
  const [loading, setLoading] = useState<boolean>(false)

  // Función para comprobar el estado de los sistemas
  const checkSystemStatus = async () => {
    setLoading(true)

    try {
      // Comprobar estado de la base de datos
      const dbStatus = await AnalyticsService.checkDatabaseStatus()
      setStatus((prev) => ({
        ...prev,
        database: {
          status: dbStatus.status as "healthy" | "unhealthy",
          message: dbStatus.message,
          error: dbStatus.error,
        },
      }))
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        database: {
          status: "unhealthy",
          message: "Error al comprobar el estado de la base de datos",
          error: "CONNECTION_ERROR",
        },
      }))
    }

    try {
      // Comprobar estado del servidor Rasa
      const response = await fetch("/api/rasa-test")
      const rasaStatus = await response.json()

      setStatus((prev) => ({
        ...prev,
        rasa: {
          status: rasaStatus.status === "success" ? "healthy" : "unhealthy",
          message: rasaStatus.message,
          error: rasaStatus.error,
        },
      }))
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        rasa: {
          status: "unhealthy",
          message: "Error al comprobar el estado del servidor Rasa",
          error: "CONNECTION_ERROR",
        },
      }))
    }

    setLoading(false)
  }

  // Comprobar el estado al cargar el componente
  useEffect(() => {
    checkSystemStatus()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del Sistema</CardTitle>
        <CardDescription>Estado actual de las conexiones a servicios externos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de la base de datos */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium">Base de Datos</h3>
            {status.database.status === "checking" ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : status.database.status === "healthy" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>

          {status.database.status === "unhealthy" ? (
            <DatabaseError
              error={{
                message: status.database.message,
                code: status.database.error,
                type: "ConnectionError",
              }}
              onRetry={() => checkSystemStatus()}
              className="mt-2"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{status.database.message}</p>
          )}
        </div>

        {/* Estado del servidor Rasa */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium">Servidor Rasa</h3>
            {status.rasa.status === "checking" ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : status.rasa.status === "healthy" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>

          {status.rasa.status === "unhealthy" ? (
            <div className="rounded-md bg-destructive/15 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-destructive">Error de conexión</p>
                  <p className="text-sm text-muted-foreground">{status.rasa.message}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{status.rasa.message}</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={checkSystemStatus} disabled={loading}>
          {loading ? "Comprobando..." : "Comprobar conexiones"}
        </Button>
      </CardFooter>
    </Card>
  )
}
