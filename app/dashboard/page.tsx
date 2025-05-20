import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, FileText, Users, Clock } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Totales</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">+5 nuevos esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">+18% respecto al mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">-0.1s respecto al mes anterior</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
            <CardDescription>Las consultas más comunes realizadas al asistente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                "¿Cuáles son los horarios de la biblioteca?",
                "¿Cómo solicito un certificado de estudios?",
                "¿Cuándo comienza el período de inscripción?",
                "¿Dónde puedo encontrar el calendario académico?",
                "¿Cómo contacto a mi profesor de matemáticas?",
              ].map((question, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{question}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{Math.floor(Math.random() * 100) + 10} veces</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Documentos Recientes</CardTitle>
            <CardDescription>Últimos documentos añadidos al sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                "Calendario Académico 2023-2024",
                "Reglamento Estudiantil",
                "Horarios de Exámenes Finales",
                "Guía de Servicios Estudiantiles",
                "Protocolo de Emergencias",
              ].map((doc, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc}</p>
                    <p className="text-xs text-muted-foreground">
                      Actualizado hace {Math.floor(Math.random() * 10) + 1} días
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
