"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    // Simular guardado
    setTimeout(() => {
      setIsSaving(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }, 1500)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
      </div>

      {showSuccess && (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>La configuración se ha guardado correctamente.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="account">Cuenta</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          {(user?.role === "admin" || user?.role === "teacher") && (
            <TabsTrigger value="assistant">Asistente</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Configura las opciones generales de la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select defaultValue="es">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecciona un idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">Inglés</SelectItem>
                    <SelectItem value="fr">Francés</SelectItem>
                    <SelectItem value="pt">Portugués</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Select defaultValue="america-santiago">
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Selecciona una zona horaria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-santiago">América/Santiago</SelectItem>
                    <SelectItem value="america-bogota">América/Bogotá</SelectItem>
                    <SelectItem value="america-mexico">América/Ciudad de México</SelectItem>
                    <SelectItem value="america-buenos-aires">América/Buenos Aires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Modo Oscuro</Label>
                  <p className="text-sm text-muted-foreground">Activar automáticamente el modo oscuro</p>
                </div>
                <Switch id="dark-mode" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notificaciones</Label>
                  <p className="text-sm text-muted-foreground">Recibir notificaciones del sistema</p>
                </div>
                <Switch id="notifications" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Cuenta</CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input id="first-name" defaultValue={user?.name.split(" ")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Apellido</Label>
                  <Input id="last-name" defaultValue={user?.name.split(" ")[1] || ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input id="current-password" type="password" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Actualizar Perfil"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>Configura cómo y cuándo recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Correo</Label>
                  <p className="text-sm text-muted-foreground">Recibir notificaciones por correo electrónico</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones en el Navegador</Label>
                  <p className="text-sm text-muted-foreground">Mostrar notificaciones en el navegador</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Eventos</Label>
                  <p className="text-sm text-muted-foreground">Recibir notificaciones sobre eventos académicos</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Actualizaciones</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir notificaciones sobre actualizaciones del sistema
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Preferencias"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {(user?.role === "admin" || user?.role === "teacher") && (
          <TabsContent value="assistant" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Asistente</CardTitle>
                <CardDescription>Configura el comportamiento del asistente virtual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assistant-name">Nombre del Asistente</Label>
                  <Input id="assistant-name" defaultValue="EduAssistant" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assistant-greeting">Mensaje de Bienvenida</Label>
                  <Textarea
                    id="assistant-greeting"
                    defaultValue="¡Hola! Soy el asistente virtual de la institución. ¿En qué puedo ayudarte hoy?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assistant-model">Modelo de Rasa</Label>
                  <Select defaultValue="default">
                    <SelectTrigger id="assistant-model">
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Modelo Predeterminado</SelectItem>
                      <SelectItem value="spacy">Modelo con SpaCy</SelectItem>
                      <SelectItem value="bert">Modelo con BERT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aprendizaje Continuo</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que el asistente aprenda de las interacciones
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Respuestas Fallback</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar respuestas alternativas cuando no se entiende la pregunta
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fallback-message">Mensaje de Fallback</Label>
                  <Textarea
                    id="fallback-message"
                    defaultValue="Lo siento, no he entendido tu pregunta. ¿Podrías reformularla o ser más específico?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">Umbral de Confianza</Label>
                  <div className="flex items-center gap-2">
                    <Input id="confidence-threshold" type="number" min="0" max="1" step="0.01" defaultValue="0.7" />
                    <span className="text-sm text-muted-foreground">(0-1)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nivel mínimo de confianza para que el asistente responda
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Entrenar Modelo</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
