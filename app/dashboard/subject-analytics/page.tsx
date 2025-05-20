"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubjectSelector } from "@/components/subject-analytics/subject-selector"
import { SubjectMetricsSummary } from "@/components/subject-analytics/subject-metrics-summary"
import { QuestionTrendChart } from "@/components/subject-analytics/question-trend-chart"
import { TopicFrequencyChart } from "@/components/subject-analytics/topic-frequency-chart"
import { DifficultQuestionsTable } from "@/components/subject-analytics/difficult-questions-table"
import { RecentQuestionsList } from "@/components/subject-analytics/recent-questions-list"
import { ConfidenceDistributionChart } from "@/components/subject-analytics/confidence-distribution-chart"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { AlertCircle, BarChart3, Download, BookOpen, HelpCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"

export default function SubjectAnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [date, setDate] = useState({
    from: addDays(new Date(), -30),
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

  const handleSubjectChange = (subjectId: number) => {
    setSelectedSubjectId(subjectId)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análisis por Materias</h2>
          <p className="text-muted-foreground">Analiza las preguntas y tendencias relacionadas con tus materias</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Datos
          </Button>
        </div>
      </div>

      <SubjectSelector onSubjectChange={handleSubjectChange} />

      {selectedSubjectId && <SubjectMetricsSummary subjectId={selectedSubjectId} />}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visión General
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Preguntas
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Temas
          </TabsTrigger>
          <TabsTrigger value="difficulties" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Dificultades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {selectedSubjectId && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <QuestionTrendChart subjectId={selectedSubjectId} />
                <ConfidenceDistributionChart subjectId={selectedSubjectId} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TopicFrequencyChart subjectId={selectedSubjectId} />
                <RecentQuestionsList subjectId={selectedSubjectId} />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {selectedSubjectId && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Preguntas</CardTitle>
                  <CardDescription>Análisis detallado de las preguntas realizadas sobre esta materia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <RecentQuestionsList subjectId={selectedSubjectId} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          {selectedSubjectId && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Temas</CardTitle>
                  <CardDescription>Análisis detallado de los temas más consultados en esta materia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <TopicFrequencyChart subjectId={selectedSubjectId} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="difficulties" className="space-y-4">
          {selectedSubjectId && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Dificultades</CardTitle>
                  <CardDescription>Preguntas que el asistente no pudo responder correctamente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <DifficultQuestionsTable subjectId={selectedSubjectId} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
