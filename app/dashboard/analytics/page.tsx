"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricsSummary } from "@/components/analytics/metrics-summary"
import { ConversationVolumeChart } from "@/components/analytics/conversation-volume-chart"
import { ResponseMetricsChart } from "@/components/analytics/response-metrics-chart"
import { IntentDistributionChart } from "@/components/analytics/intent-distribution-chart"
import { KeywordCloud } from "@/components/analytics/keyword-cloud"
import { UserCategoryChart } from "@/components/analytics/user-category-chart"
import { SatisfactionChart } from "@/components/analytics/satisfaction-chart"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { AlertCircle, BarChart3, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [date, setDate] = useState({
    from: addDays(new Date(), -7),
    to: new Date(),
  })

  // Verificar si el usuario es profesor o administrador
  if (user?.role !== "teacher" && user?.role !== "admin") {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
        <p className="text-muted-foreground mb-4">
          Solo los profesores y administradores pueden acceder a esta sección.
        </p>
        <Button onClick={() => router.push("/dashboard")}>Volver al Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análisis de Conversaciones</h2>
          <p className="text-muted-foreground">
            Métricas y visualizaciones para analizar el rendimiento del asistente virtual
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Datos
          </Button>
        </div>
      </div>

      <MetricsSummary />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visión General
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="h-4 w-4" />
            Análisis Diario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ConversationVolumeChart />
            <ResponseMetricsChart />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <IntentDistributionChart />
            <KeywordCloud />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <UserCategoryChart />
            <SatisfactionChart />
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Detallado por Día</CardTitle>
              <CardDescription>
                Selecciona una fecha específica para ver un análisis detallado de las conversaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta sección mostrará un análisis detallado de las conversaciones para un día específico, incluyendo:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Distribución horaria de las conversaciones</li>
                <li>Duración promedio de las sesiones</li>
                <li>Temas más consultados</li>
                <li>Ejemplos de conversaciones</li>
                <li>Análisis de sentimiento</li>
              </ul>
              <div className="flex justify-center mt-8">
                <p className="text-muted-foreground">
                  Selecciona una fecha en el selector de arriba para ver el análisis detallado
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
