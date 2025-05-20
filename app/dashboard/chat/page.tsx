"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, School, Paperclip, MoreVertical, ThumbsUp, ThumbsDown } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  startConversation,
  endConversation,
  logMessage,
  extractAndStoreKeywords,
  saveConversationFeedback,
} from "@/lib/server-actions"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  intent?: string
  confidence?: number
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "¡Hola! Soy el asistente virtual de la institución. ¿En qué puedo ayudarte hoy?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Iniciar una nueva conversación al cargar el componente
  useEffect(() => {
    const startNewConversation = async () => {
      try {
        const response = await startConversation(user?.id ? Number.parseInt(user.id) : undefined)

        if (response.success && response.conversationId) {
          setConversationId(response.conversationId)

          // Registrar el mensaje inicial del asistente
          await logMessage(
            response.conversationId,
            "assistant",
            "¡Hola! Soy el asistente virtual de la institución. ¿En qué puedo ayudarte hoy?",
          )
        } else {
          console.error("Error al iniciar conversación:", response.error)
          toast({
            title: "Error al iniciar conversación",
            description: "No se pudo iniciar una nueva conversación. Por favor, intenta nuevamente.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error al iniciar conversación:", error)
        toast({
          title: "Error al iniciar conversación",
          description: "No se pudo iniciar una nueva conversación. Por favor, intenta nuevamente.",
          variant: "destructive",
        })
      }
    }

    startNewConversation()

    // Finalizar la conversación al desmontar el componente
    return () => {
      if (conversationId) {
        endConversation(conversationId).catch((error) => {
          console.error("Error al finalizar conversación:", error)
        })
      }
    }
  }, [user, toast])

  // Función para enviar un mensaje al asistente
  const sendMessageToAssistant = async (userMessage: string) => {
    setIsLoading(true)

    try {
      // Enviar mensaje a Rasa a través de nuestra API
      const rasaResponse = await fetch("/api/rasa/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          userId: user?.id || "default",
        }),
      })

      if (!rasaResponse.ok) {
        throw new Error(`Error al comunicarse con Rasa: ${rasaResponse.statusText}`)
      }

      const responses = await rasaResponse.json()

      // Extraer intención y confianza
      let intent: string | undefined
      let confidence: number | undefined

      try {
        const parseResponse = await fetch("/api/rasa/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: userMessage }),
        })

        if (parseResponse.ok) {
          const parseResult = await parseResponse.json()
          if (parseResult.intents && parseResult.intents.length > 0) {
            intent = parseResult.intents[0].name
            confidence = parseResult.intents[0].confidence
          }
        }
      } catch (error) {
        console.error("Error al extraer intención:", error)
      }

      // Registrar mensaje del usuario en la base de datos
      if (conversationId) {
        await logMessage(conversationId, "user", userMessage, intent, confidence)

        // Extraer y almacenar palabras clave
        const today = new Date().toISOString().split("T")[0]
        await extractAndStoreKeywords(userMessage, today)
      }

      // Verificar si hay respuesta
      if (responses && responses.length > 0 && responses[0].text) {
        const newMessage: Message = {
          id: Date.now().toString(),
          content: responses[0].text,
          role: "assistant",
          timestamp: new Date(),
          intent,
          confidence,
        }

        setMessages((prev) => [...prev, newMessage])

        // Registrar mensaje del asistente en la base de datos
        if (conversationId) {
          await logMessage(conversationId, "assistant", responses[0].text)
        }
      } else {
        // Si no hay respuesta, mostrar un mensaje genérico
        const newMessage: Message = {
          id: Date.now().toString(),
          content: "Lo siento, no pude generar una respuesta para esa consulta. ¿Podrías reformular tu pregunta?",
          role: "assistant",
          timestamp: new Date(),
          intent: "fallback",
          confidence: 0,
        }

        setMessages((prev) => [...prev, newMessage])

        // Registrar mensaje de fallback en la base de datos
        if (conversationId) {
          await logMessage(
            conversationId,
            "assistant",
            "Lo siento, no pude generar una respuesta para esa consulta. ¿Podrías reformular tu pregunta?",
            "fallback",
            0,
          )
        }
      }
    } catch (error) {
      console.error("Error al comunicarse con el asistente:", error)

      // Mensaje de error en caso de fallo de comunicación
      const newMessage: Message = {
        id: Date.now().toString(),
        content:
          "Lo siento, estoy teniendo problemas para procesar tu solicitud. Por favor, intenta nuevamente más tarde.",
        role: "assistant",
        timestamp: new Date(),
        intent: "error",
        confidence: 0,
      }

      setMessages((prev) => [...prev, newMessage])

      // Registrar mensaje de error en la base de datos
      if (conversationId) {
        await logMessage(
          conversationId,
          "assistant",
          "Lo siento, estoy teniendo problemas para procesar tu solicitud. Por favor, intenta nuevamente más tarde.",
          "error",
          0,
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")

    // Enviar mensaje al asistente
    sendMessageToAssistant(input)
  }

  // Función para enviar feedback
  const handleFeedback = async (messageId: string, rating: number) => {
    if (!conversationId) return

    try {
      const response = await saveConversationFeedback(conversationId, rating)

      if (response.success) {
        setShowFeedback(null)

        toast({
          title: "Feedback enviado",
          description: "Gracias por tu feedback. Nos ayuda a mejorar el asistente.",
        })
      } else {
        throw new Error(response.error?.message || "Error al enviar feedback")
      }
    } catch (error) {
      console.error("Error al enviar feedback:", error)

      toast({
        title: "Error al enviar feedback",
        description: "No se pudo enviar tu feedback. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Desplazarse al final de los mensajes cuando se añade uno nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] p-4">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Avatar" />
                <AvatarFallback>
                  <School className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Asistente Virtual</CardTitle>
                <CardDescription>Conectado y listo para ayudar</CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={async () => {
                    // Finalizar la conversación actual
                    if (conversationId) {
                      await endConversation(conversationId)
                    }

                    // Iniciar una nueva conversación
                    const response = await startConversation(user?.id ? Number.parseInt(user.id) : undefined)

                    if (response.success && response.conversationId) {
                      setConversationId(response.conversationId)

                      // Reiniciar mensajes
                      const initialMessage = {
                        id: Date.now().toString(),
                        content: "¡Hola! Soy el asistente virtual de la institución. ¿En qué puedo ayudarte hoy?",
                        role: "assistant" as const,
                        timestamp: new Date(),
                      }

                      setMessages([initialMessage])

                      // Registrar el mensaje inicial del asistente
                      await logMessage(response.conversationId, "assistant", initialMessage.content)
                    } else {
                      toast({
                        title: "Error al reiniciar conversación",
                        description: "No se pudo iniciar una nueva conversación. Por favor, intenta nuevamente.",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  Borrar conversación
                </DropdownMenuItem>
                <DropdownMenuItem>Exportar chat</DropdownMenuItem>
                <DropdownMenuItem>Reportar problema</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex max-w-[80%] items-start gap-2 rounded-lg px-4 py-2 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        <School className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {message.role === "assistant" && message.id !== "1" && (
                        <div className="flex items-center gap-1 ml-2">
                          {showFeedback === message.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleFeedback(message.id, 5)}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleFeedback(message.id, 1)}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setShowFeedback(message.id)}
                            >
                              Feedback
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      <School className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="shrink-0">
              <Paperclip className="h-4 w-4" />
              <span className="sr-only">Adjuntar archivo</span>
            </Button>
            <Input
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar mensaje</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
