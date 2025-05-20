"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type User = {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulación de verificación de sesión
    const checkSession = async () => {
      try {
        // En una implementación real, verificaríamos la sesión con el servidor
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulación de login - en una implementación real, esto sería una llamada a la API
      // Esperar 1 segundo para simular la llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Datos de usuario de ejemplo basados en el email
      let mockUser: User

      if (email.includes("admin")) {
        mockUser = { id: "1", name: "Admin Usuario", email, role: "admin" }
      } else if (email.includes("teacher") || email.includes("profesor")) {
        mockUser = { id: "2", name: "Profesor Ejemplo", email, role: "teacher" }
      } else {
        mockUser = { id: "3", name: "Estudiante Ejemplo", email, role: "student" }
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
