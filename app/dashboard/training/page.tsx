"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  FileUp,
  FileText,
  Plus,
  Trash,
  Brain,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Edit,
  Save,
  X,
  Info,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import rasaClient, { type RasaIntent, type RasaEntity } from "@/lib/rasa-client"

// Tipos para el entrenamiento
type DocumentType = {
  id: string
  name: string
  type: string
  size: string
  status: "processing" | "processed" | "error"
  content?: string
  extractedEntities?: RasaEntity[]
  extractedIntents?: RasaIntent[]
  error?: string
}

type TrainingStatus = "idle" | "extracting" | "training" | "completed" | "error"

export default function TrainingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>("idle")
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingMessage, setTrainingMessage] = useState("")
  const [testMessage, setTestMessage] = useState("")
  const [testResponse, setTestResponse] = useState("")
  const [isTestLoading, setIsTestLoading] = useState(false)
  const [showTestArea, setShowTestArea] = useState(false)
  const [editingIntent, setEditingIntent] = useState<string | null>(null)
  const [newIntentName, setNewIntentName] = useState("")
  const [newIntentExample, setNewIntentExample] = useState("")
  const [newEntityName, setNewEntityName] = useState("")
  const [newEntityValue, setNewEntityValue] = useState("")
  const [newEntityExample, setNewEntityExample] = useState("")
  const [isRasaAvailable, setIsRasaAvailable] = useState(false)
  const [isCheckingRasa, setIsCheckingRasa] = useState(true)
  const trainingStatusInterval = useRef<NodeJS.Timeout | null>(null)

  // Verificar si el servidor Rasa está disponible al cargar la página
  useEffect(() => {
    const checkRasaStatus = async () => {
      try {
        setIsCheckingRasa(true)
        const status = await rasaClient.getTrainingStatus()
        setIsRasaAvailable(true)
        setIsCheckingRasa(false)
      } catch (error) {
        console.error("Error al verificar el estado de Rasa:", error)
        setIsRasaAvailable(false)
        setIsCheckingRasa(false)
      }
    }

    checkRasaStatus()
  }, [])

  // Limpiar el intervalo de verificación de estado al desmontar el componente
  useEffect(() => {
    return () => {
      if (trainingStatusInterval.current) {
        clearInterval(trainingStatusInterval.current)
      }
    }
  }, [])

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

  // Función para procesar un archivo y extraer su contenido
  const processFile = async (file: File, docId: string) => {
    try {
      // Extraer texto del documento
      const content = await rasaClient.extractTextFromDocument(file)

      if (!content || content.trim() === "") {
        throw new Error("No se pudo extraer texto del documento")
      }

      // Extraer intenciones y entidades del texto
      const { intents, entities } = await rasaClient.extractIntentsAndEntities(content)

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "processed",
                content: content.length > 500 ? content.substring(0, 500) + "..." : content,
                extractedIntents: intents,
                extractedEntities: entities,
              }
            : doc,
        ),
      )

      toast({
        title: "Documento procesado",
        description: `El documento ${file.name} ha sido procesado correctamente.`,
      })
    } catch (error) {
      console.error("Error al procesar el documento:", error)

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "error",
                error: error instanceof Error ? error.message : "Error desconocido al procesar el documento",
              }
            : doc,
        ),
      )

      toast({
        title: "Error al procesar",
        description: `No se pudo procesar el documento ${file.name}.`,
        variant: "destructive",
      })
    }
  }

  // Función para manejar la carga de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (!isRasaAvailable) {
      toast({
        title: "Servidor Rasa no disponible",
        description: "No se puede procesar documentos porque el servidor Rasa no está disponible.",
        variant: "destructive",
      })
      return
    }

    const newDocuments: DocumentType[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""
      const fileType = getFileType(fileExtension)

      if (fileType === "unsupported") {
        toast({
          title: "Formato no soportado",
          description: `El archivo ${file.name} tiene un formato no soportado.`,
          variant: "destructive",
        })
        continue
      }

      const newDoc: DocumentType = {
        id: Date.now().toString() + i,
        name: file.name,
        type: fileType,
        size: formatFileSize(file.size),
        status: "processing",
      }

      newDocuments.push(newDoc)

      // Procesar el documento
      processFile(file, newDoc.id)
    }

    setDocuments((prev) => [...prev, ...newDocuments])
    e.target.value = ""
  }

  // Función para determinar el tipo de archivo
  const getFileType = (extension: string): string => {
    switch (extension) {
      case "pdf":
        return "PDF"
      case "docx":
      case "doc":
        return "Word"
      case "txt":
        return "Texto"
      default:
        return "unsupported"
    }
  }

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Función para eliminar un documento
  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
    toast({
      title: "Documento eliminado",
      description: "El documento ha sido eliminado de la lista de entrenamiento.",
    })
  }

  // Función para cambiar la selección de una entidad
  const toggleEntitySelection = (docId: string, entityId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId && doc.extractedEntities) {
          return {
            ...doc,
            extractedEntities: doc.extractedEntities.map((entity) =>
              entity.id === entityId ? { ...entity, selected: !entity.selected } : entity,
            ),
          }
        }
        return doc
      }),
    )
  }

  // Función para cambiar la selección de una intención
  const toggleIntentSelection = (docId: string, intentId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId && doc.extractedIntents) {
          return {
            ...doc,
            extractedIntents: doc.extractedIntents.map((intent) =>
              intent.id === intentId ? { ...intent, selected: !intent.selected } : intent,
            ),
          }
        }
        return doc
      }),
    )
  }

  // Función para iniciar el entrenamiento
  const startTraining = async () => {
    if (documents.length === 0) {
      toast({
        title: "No hay documentos",
        description: "Debes subir al menos un documento para entrenar el asistente.",
        variant: "destructive",
      })
      return
    }

    if (!isRasaAvailable) {
      toast({
        title: "Servidor Rasa no disponible",
        description: "No se puede iniciar el entrenamiento porque el servidor Rasa no está disponible.",
        variant: "destructive",
      })
      return
    }

    try {
      setTrainingStatus("extracting")
      setTrainingProgress(0)
      setTrainingMessage("Preparando datos para el entrenamiento...")

      // Recopilar todas las intenciones y entidades seleccionadas
      const allIntents: RasaIntent[] = []
      const allEntities: RasaEntity[] = []

      documents.forEach((doc) => {
        if (doc.status === "processed") {
          if (doc.extractedIntents) {
            allIntents.push(...doc.extractedIntents)
          }
          if (doc.extractedEntities) {
            allEntities.push(...doc.extractedEntities)
          }
        }
      })

      // Preparar los datos de entrenamiento
      const trainingData = rasaClient.prepareTrainingData(allIntents, allEntities)

      // Iniciar el entrenamiento
      setTrainingStatus("training")
      setTrainingProgress(30)
      setTrainingMessage("Entrenando modelo de lenguaje natural...")

      await rasaClient.trainModel(trainingData)

      // Iniciar la verificación del estado del entrenamiento
      startTrainingStatusCheck()
    } catch (error) {
      console.error("Error al iniciar el entrenamiento:", error)
      setTrainingStatus("error")
      setTrainingMessage(
        error instanceof Error ? `Error: ${error.message}` : "Error desconocido al iniciar el entrenamiento",
      )

      toast({
        title: "Error al iniciar entrenamiento",
        description: "No se pudo iniciar el entrenamiento del modelo. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Función para verificar periódicamente el estado del entrenamiento
  const startTrainingStatusCheck = () => {
    // Limpiar cualquier intervalo existente
    if (trainingStatusInterval.current) {
      clearInterval(trainingStatusInterval.current)
    }

    // Crear un nuevo intervalo para verificar el estado
    trainingStatusInterval.current = setInterval(async () => {
      try {
        const status = await rasaClient.getTrainingStatus()

        if (status.status === "training") {
          setTrainingProgress(30 + (status.progress || 0) * 0.6) // Mapear el progreso de 0-100 a 30-90
          setTrainingMessage(status.message || "Entrenando modelo...")
        } else if (status.status === "ready") {
          clearInterval(trainingStatusInterval.current!)
          completeTraining()
        } else if (status.status === "error") {
          clearInterval(trainingStatusInterval.current!)
          setTrainingStatus("error")
          setTrainingMessage(status.message || "Error durante el entrenamiento")

          toast({
            title: "Error en el entrenamiento",
            description: status.message || "Ha ocurrido un error durante el entrenamiento.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error al verificar el estado del entrenamiento:", error)
        clearInterval(trainingStatusInterval.current!)
        setTrainingStatus("error")
        setTrainingMessage("Error al verificar el estado del entrenamiento")

        toast({
          title: "Error de comunicación",
          description: "No se pudo verificar el estado del entrenamiento.",
          variant: "destructive",
        })
      }
    }, 3000) // Verificar cada 3 segundos
  }

  // Función para completar el entrenamiento
  const completeTraining = () => {
    setTrainingProgress(100)
    setTrainingStatus("completed")
    setTrainingMessage("¡Entrenamiento completado con éxito!")
    setShowTestArea(true)

    toast({
      title: "Entrenamiento completado",
      description: "El asistente ha sido entrenado con los nuevos documentos.",
    })
  }

  // Función para probar el asistente
  const testAssistant = async () => {
    if (!testMessage.trim()) return

    setIsTestLoading(true)
    setTestResponse("")

    try {
      const responses = await rasaClient.sendMessage(testMessage)

      if (responses && responses.length > 0 && responses[0].text) {
        setTestResponse(responses[0].text)
      } else {
        setTestResponse("No pude generar una respuesta para esa pregunta. Por favor, intenta con otra consulta.")
      }
    } catch (error) {
      console.error("Error al probar el asistente:", error)
      setTestResponse("Error al comunicarse con el asistente. Por favor, intenta nuevamente.")

      toast({
        title: "Error de comunicación",
        description: "No se pudo obtener respuesta del asistente.",
        variant: "destructive",
      })
    } finally {
      setIsTestLoading(false)
    }
  }

  // Función para añadir una nueva intención
  const handleAddIntent = () => {
    if (!newIntentName.trim() || !newIntentExample.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Debes proporcionar un nombre y al menos un ejemplo para la intención.",
        variant: "destructive",
      })
      return
    }

    const newIntent: RasaIntent = {
      id: "intent-" + Date.now(),
      name: newIntentName.trim(),
      examples: [newIntentExample.trim()],
      selected: true,
      confidence: 0.8,
    }

    // Añadir la nueva intención al primer documento (podría mejorarse para seleccionar el documento)
    if (documents.length > 0) {
      setDocuments((prev) =>
        prev.map((doc, index) => {
          if (index === 0) {
            return {
              ...doc,
              extractedIntents: [...(doc.extractedIntents || []), newIntent],
            }
          }
          return doc
        }),
      )
    }

    setNewIntentName("")
    setNewIntentExample("")

    toast({
      title: "Intención añadida",
      description: `La intención "${newIntentName}" ha sido añadida correctamente.`,
    })
  }

  // Función para añadir una nueva entidad
  const handleAddEntity = () => {
    if (!newEntityName.trim() || !newEntityValue.trim() || !newEntityExample.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Debes proporcionar un nombre, valor y al menos un ejemplo para la entidad.",
        variant: "destructive",
      })
      return
    }

    const newEntity: RasaEntity = {
      id: "entity-" + Date.now(),
      entity: newEntityName.trim(),
      value: newEntityValue.trim(),
      examples: [newEntityExample.trim()],
      selected: true,
    }

    // Añadir la nueva entidad al primer documento (podría mejorarse para seleccionar el documento)
    if (documents.length > 0) {
      setDocuments((prev) =>
        prev.map((doc, index) => {
          if (index === 0) {
            return {
              ...doc,
              extractedEntities: [...(doc.extractedEntities || []), newEntity],
            }
          }
          return doc
        }),
      )
    }

    setNewEntityName("")
    setNewEntityValue("")
    setNewEntityExample("")

    toast({
      title: "Entidad añadida",
      description: `La entidad "${newEntityName}" ha sido añadida correctamente.`,
    })
  }

  // Función para guardar una intención editada
  const handleSaveIntent = (docId: string, intentId: string, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: "Nombre inválido",
        description: "El nombre de la intención no puede estar vacío.",
        variant: "destructive",
      })
      return
    }

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId && doc.extractedIntents) {
          return {
            ...doc,
            extractedIntents: doc.extractedIntents.map((intent) =>
              intent.id === intentId ? { ...intent, name: newName.trim() } : intent,
            ),
          }
        }
        return doc
      }),
    )

    setEditingIntent(null)
    toast({
      title: "Intención actualizada",
      description: `La intención ha sido renombrada a "${newName}".`,
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Entrenamiento del Asistente</h2>
        <div className="flex items-center gap-2">
          {isCheckingRasa ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Verificando conexión
            </Badge>
          ) : isRasaAvailable ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              Servidor Rasa conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
              Servidor Rasa no disponible
            </Badge>
          )}
        </div>
      </div>

      {!isRasaAvailable && !isCheckingRasa && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Servidor Rasa no disponible</AlertTitle>
          <AlertDescription>
            No se pudo establecer conexión con el servidor Rasa. Algunas funcionalidades estarán limitadas o no
            disponibles. Por favor, verifica la configuración del servidor y asegúrate de que esté en funcionamiento.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="intents">Intenciones</TabsTrigger>
          <TabsTrigger value="entities">Entidades</TabsTrigger>
          <TabsTrigger value="training">Entrenamiento</TabsTrigger>
        </TabsList>

        {/* Pestaña de Documentos */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subir Documentos</CardTitle>
              <CardDescription>
                Sube documentos para entrenar al asistente. Formatos soportados: PDF, DOCX, TXT.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arrastra y suelta archivos aquí o haz clic para seleccionar
                </p>
                <Input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  multiple
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  disabled={!isRasaAvailable}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={!isRasaAvailable}
                >
                  Seleccionar Archivos
                </Button>
                {!isRasaAvailable && (
                  <p className="text-xs text-destructive mt-2">
                    La carga de documentos no está disponible porque el servidor Rasa no está conectado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documentos Cargados</CardTitle>
                <CardDescription>
                  {documents.length} documento{documents.length !== 1 ? "s" : ""} para entrenamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.type} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === "processing" ? (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            >
                              Procesando...
                            </Badge>
                          ) : doc.status === "processed" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            >
                              Procesado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            >
                              Error
                            </Badge>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {doc.status === "error" && doc.error && (
                        <Alert variant="destructive" className="mt-2 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error al procesar</AlertTitle>
                          <AlertDescription>{doc.error}</AlertDescription>
                        </Alert>
                      )}

                      {doc.status === "processed" && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="content">
                            <AccordionTrigger>Ver contenido extraído</AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-muted p-3 rounded-md text-sm">
                                <p>{doc.content}</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={startTraining}
                  disabled={
                    !isRasaAvailable || documents.length === 0 || documents.every((doc) => doc.status !== "processed")
                  }
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Iniciar Entrenamiento
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Pestaña de Intenciones */}
        <TabsContent value="intents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intenciones Detectadas</CardTitle>
              <CardDescription>
                Intenciones extraídas de los documentos. Selecciona las que deseas incluir en el entrenamiento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay documentos cargados para extraer intenciones.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {documents.map(
                    (doc) =>
                      doc.status === "processed" &&
                      doc.extractedIntents && (
                        <div key={doc.id} className="space-y-4">
                          <h3 className="text-sm font-medium text-muted-foreground">Intenciones de: {doc.name}</h3>
                          <div className="space-y-3">
                            {doc.extractedIntents.map((intent) => (
                              <div key={intent.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {editingIntent === intent.id ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={intent.name}
                                          onChange={(e) => {
                                            setDocuments((prev) =>
                                              prev.map((d) => {
                                                if (d.id === doc.id && d.extractedIntents) {
                                                  return {
                                                    ...d,
                                                    extractedIntents: d.extractedIntents.map((i) =>
                                                      i.id === intent.id ? { ...i, name: e.target.value } : i,
                                                    ),
                                                  }
                                                }
                                                return d
                                              }),
                                            )
                                          }}
                                          className="h-8 w-48"
                                        />
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleSaveIntent(doc.id, intent.id!, intent.name)}
                                        >
                                          <Save className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setEditingIntent(null)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="font-medium">{intent.name}</span>
                                        {intent.confidence !== undefined && (
                                          <Badge variant="outline">{(intent.confidence * 100).toFixed(0)}%</Badge>
                                        )}
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => setEditingIntent(intent.id!)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={intent.selected}
                                      onCheckedChange={() => toggleIntentSelection(doc.id, intent.id!)}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Ejemplos:</p>
                                  <ul className="space-y-1 text-sm">
                                    {intent.examples.map((example, index) => (
                                      <li key={index} className="text-muted-foreground">
                                        • {example}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <Separator />
              <div className="w-full">
                <h3 className="text-sm font-medium mb-2">Añadir Nueva Intención</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="intent-name">Nombre de la Intención</Label>
                      <Input
                        id="intent-name"
                        placeholder="Ej: consultar_horario"
                        value={newIntentName}
                        onChange={(e) => setNewIntentName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intent-example">Ejemplo</Label>
                      <Input
                        id="intent-example"
                        placeholder="Ej: ¿Cuál es el horario de la biblioteca?"
                        value={newIntentExample}
                        onChange={(e) => setNewIntentExample(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddIntent}
                    disabled={!newIntentName || !newIntentExample || documents.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Intención
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pestaña de Entidades */}
        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entidades Detectadas</CardTitle>
              <CardDescription>
                Entidades extraídas de los documentos. Selecciona las que deseas incluir en el entrenamiento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay documentos cargados para extraer entidades.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {documents.map(
                    (doc) =>
                      doc.status === "processed" &&
                      doc.extractedEntities && (
                        <div key={doc.id} className="space-y-4">
                          <h3 className="text-sm font-medium text-muted-foreground">Entidades de: {doc.name}</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Ejemplos</TableHead>
                                <TableHead className="text-right">Incluir</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {doc.extractedEntities.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                    No se detectaron entidades en este documento
                                  </TableCell>
                                </TableRow>
                              ) : (
                                doc.extractedEntities.map((entity) => (
                                  <TableRow key={entity.id}>
                                    <TableCell className="font-medium">{entity.entity}</TableCell>
                                    <TableCell>{entity.value}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {entity.examples.map((example, index) => (
                                          <Badge key={index} variant="outline">
                                            {example}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Switch
                                        checked={entity.selected}
                                        onCheckedChange={() => toggleEntitySelection(doc.id, entity.id!)}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      ),
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <Separator />
              <div className="w-full">
                <h3 className="text-sm font-medium mb-2">Añadir Nueva Entidad</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entity-name">Nombre</Label>
                      <Input
                        id="entity-name"
                        placeholder="Ej: horario"
                        value={newEntityName}
                        onChange={(e) => setNewEntityName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entity-value">Valor</Label>
                      <Input
                        id="entity-value"
                        placeholder="Ej: tiempo"
                        value={newEntityValue}
                        onChange={(e) => setNewEntityValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entity-example">Ejemplo</Label>
                      <Input
                        id="entity-example"
                        placeholder="Ej: 8:00 AM"
                        value={newEntityExample}
                        onChange={(e) => setNewEntityExample(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddEntity}
                    disabled={!newEntityName || !newEntityValue || !newEntityExample || documents.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Entidad
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pestaña de Entrenamiento */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Entrenamiento</CardTitle>
              <CardDescription>
                Inicia el entrenamiento del asistente con los documentos y datos seleccionados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Progreso del Entrenamiento</p>
                  <p className="text-sm text-muted-foreground">{trainingProgress.toFixed(0)}%</p>
                </div>
                <Progress value={trainingProgress} className="h-2" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Estado:</p>
                <div className="flex items-center gap-2">
                  {trainingStatus === "idle" ? (
                    <Badge variant="outline">Esperando inicio</Badge>
                  ) : trainingStatus === "extracting" ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      Extrayendo datos
                    </Badge>
                  ) : trainingStatus === "training" ? (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    >
                      Entrenando modelo
                    </Badge>
                  ) : trainingStatus === "completed" ? (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    >
                      Completado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      Error
                    </Badge>
                  )}
                  <span className="text-sm">{trainingMessage}</span>
                </div>
              </div>

              {trainingStatus === "idle" && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Información</AlertTitle>
                  <AlertDescription>
                    Para iniciar el entrenamiento, primero debes subir documentos y seleccionar las intenciones y
                    entidades que deseas incluir.
                  </AlertDescription>
                </Alert>
              )}

              {trainingStatus === "completed" && (
                <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Entrenamiento Completado</AlertTitle>
                  <AlertDescription>
                    El modelo ha sido entrenado exitosamente. Ahora puedes probar el asistente con nuevas preguntas.
                  </AlertDescription>
                </Alert>
              )}

              {trainingStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error en el Entrenamiento</AlertTitle>
                  <AlertDescription>
                    {trainingMessage || "Ha ocurrido un error durante el entrenamiento. Por favor, intenta nuevamente."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {trainingStatus === "idle" ? (
                <Button
                  onClick={startTraining}
                  disabled={
                    !isRasaAvailable || documents.length === 0 || documents.every((doc) => doc.status !== "processed")
                  }
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Iniciar Entrenamiento
                </Button>
              ) : trainingStatus === "completed" ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setTrainingStatus("idle")}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reiniciar
                  </Button>
                  <Button onClick={() => setShowTestArea(!showTestArea)}>
                    {showTestArea ? "Ocultar Área de Pruebas" : "Probar Asistente"}
                  </Button>
                </div>
              ) : trainingStatus === "error" ? (
                <Button variant="outline" onClick={() => setTrainingStatus("idle")}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reiniciar
                </Button>
              ) : (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </Button>
              )}
            </CardFooter>
          </Card>

          {showTestArea && (
            <Card>
              <CardHeader>
                <CardTitle>Probar Asistente</CardTitle>
                <CardDescription>Prueba el asistente con preguntas para verificar el entrenamiento.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribe una pregunta para probar el asistente..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && testMessage.trim()) {
                          testAssistant()
                        }
                      }}
                    />
                    <Button onClick={testAssistant} disabled={!testMessage.trim() || isTestLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {isTestLoading && (
                    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">El asistente está pensando...</p>
                    </div>
                  )}

                  {testResponse && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Asistente:</p>
                          <p className="text-sm">{testResponse}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo de Ayuda */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="fixed bottom-4 right-4">
            <MessageSquare className="mr-2 h-4 w-4" />
            Ayuda con el Entrenamiento
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guía de Entrenamiento</DialogTitle>
            <DialogDescription>Aprende a entrenar el asistente virtual con tus propios documentos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">1. Subir Documentos</h3>
              <p className="text-sm text-muted-foreground">
                Sube documentos en formato PDF, DOCX o TXT que contengan la información que deseas que el asistente
                aprenda.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">2. Revisar Intenciones y Entidades</h3>
              <p className="text-sm text-muted-foreground">
                El sistema extraerá automáticamente intenciones (preguntas) y entidades (datos específicos) de los
                documentos. Revisa y selecciona las que deseas incluir en el entrenamiento.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">3. Iniciar Entrenamiento</h3>
              <p className="text-sm text-muted-foreground">
                Una vez que hayas seleccionado las intenciones y entidades, inicia el entrenamiento del modelo. Este
                proceso puede tomar varios minutos dependiendo de la cantidad de datos.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">4. Probar el Asistente</h3>
              <p className="text-sm text-muted-foreground">
                Después de completar el entrenamiento, prueba el asistente con preguntas para verificar que ha aprendido
                correctamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
