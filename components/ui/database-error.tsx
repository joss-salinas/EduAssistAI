"use client"
import { AlertTriangle, RefreshCw, Database, AlertCircle, ShieldAlert, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export interface DatabaseErrorProps {
  error: {
    message: string
    code?: string
    type?: string
  }
  onRetry?: () => void
  className?: string
}

export function DatabaseError({ error, onRetry, className }: DatabaseErrorProps) {
  // Determinar qué icono mostrar según el tipo de error
  const getIcon = () => {
    if (!error.type) return AlertTriangle

    switch (error.type) {
      case "ConnectionError":
        return Database
      case "TimeoutError":
        return Clock
      case "PermissionError":
        return ShieldAlert
      case "IntegrityError":
      case "QueryError":
        return AlertCircle
      default:
        return AlertTriangle
    }
  }

  // Determinar el color según el tipo de error
  const getVariant = () => {
    if (!error.type) return "destructive"

    switch (error.type) {
      case "ConnectionError":
      case "TimeoutError":
        return "default" // Menos severo
      case "PermissionError":
      case "IntegrityError":
      case "QueryError":
        return "destructive" // Más severo
      default:
        return "destructive"
    }
  }

  // Mensaje de ayuda adicional según el tipo de error
  const getHelpText = () => {
    if (!error.type) return null

    switch (error.type) {
      case "ConnectionError":
        return "Comprueba la conexión a internet o si el servidor de base de datos está en funcionamiento."
      case "TimeoutError":
        return "La consulta ha tardado demasiado tiempo. Intenta de nuevo más tarde."
      case "PermissionError":
        return "No tienes permisos suficientes para esta operación. Contacta con el administrador."
      case "IntegrityError":
        return "Ha ocurrido un problema con la integridad de los datos. La operación no puede completarse."
      default:
        return null
    }
  }

  const Icon = getIcon()
  const variant = getVariant()
  const helpText = getHelpText()

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>Error de base de datos</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{error.message}</p>
        {helpText && <p className="text-sm opacity-80">{helpText}</p>}
        {error.code && <p className="text-xs opacity-60">Código: {error.code}</p>}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Reintentar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
