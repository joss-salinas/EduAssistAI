"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { School } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoggingIn(true)

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError("Error al iniciar sesión. Verifica tus credenciales.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <School className="h-6 w-6" />
            <span className="text-xl font-bold">EduAssistant</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Acceso al Sistema</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al asistente virtual</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Contraseña</Label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoggingIn}>
                    {isLoggingIn ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    <p>Para probar, usa:</p>
                    <p>estudiante@ejemplo.com / profesor@ejemplo.com / admin@ejemplo.com</p>
                    <p>con cualquier contraseña</p>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre Completo</Label>
                    <Input id="register-name" type="text" placeholder="Juan Pérez" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Correo Electrónico</Label>
                    <Input id="register-email" type="email" placeholder="tu@ejemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <Input id="register-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirmar Contraseña</Label>
                    <Input id="register-confirm" type="password" />
                  </div>
                  <Button className="w-full">Registrarse</Button>
                  <p className="text-center text-sm text-muted-foreground">
                    El registro requiere aprobación administrativa
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              Volver a la página principal
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
