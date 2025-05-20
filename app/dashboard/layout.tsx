"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  School,
  Home,
  MessageSquare,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  Brain,
  BarChart3,
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const isMobile = useMobile()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const NavItems = () => (
    <>
      <div className="flex items-center gap-2 px-2">
        <School className="h-6 w-6" />
        <span className="text-xl font-bold">EduAssistant</span>
      </div>
      <div className="space-y-1 py-4">
        <NavLink href="/dashboard" icon={<Home className="h-4 w-4 mr-2" />}>
          Inicio
        </NavLink>
        <NavLink href="/dashboard/chat" icon={<MessageSquare className="h-4 w-4 mr-2" />}>
          Asistente
        </NavLink>
        {(user.role === "teacher" || user.role === "admin") && (
          <>
            <NavLink href="/dashboard/documents" icon={<FileText className="h-4 w-4 mr-2" />}>
              Documentos
            </NavLink>
            <NavLink href="/dashboard/training" icon={<Brain className="h-4 w-4 mr-2" />}>
              Entrenamiento
            </NavLink>
            <NavLink href="/dashboard/analytics" icon={<BarChart3 className="h-4 w-4 mr-2" />}>
              Análisis
            </NavLink>
            <NavLink href="/dashboard/subject-analytics" icon={<BookOpen className="h-4 w-4 mr-2" />}>
              Análisis por Materias
            </NavLink>
          </>
        )}
        {user.role === "admin" && (
          <NavLink href="/dashboard/users" icon={<Users className="h-4 w-4 mr-2" />}>
            Usuarios
          </NavLink>
        )}
        <NavLink href="/dashboard/settings" icon={<Settings className="h-4 w-4 mr-2" />}>
          Configuración
        </NavLink>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mr-2">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col h-full py-4">
                  <NavItems />
                  <div className="mt-auto">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        logout()
                        router.push("/")
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="mr-4 hidden md:flex">
              <School className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1">
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="font-medium transition-colors hover:text-primary">
                Dashboard
              </Link>
              {user.role === "student" && (
                <Link href="/dashboard/chat" className="text-muted-foreground transition-colors hover:text-primary">
                  Asistente
                </Link>
              )}
              {(user.role === "teacher" || user.role === "admin") && (
                <>
                  <Link href="/dashboard/chat" className="text-muted-foreground transition-colors hover:text-primary">
                    Asistente
                  </Link>
                  <Link
                    href="/dashboard/documents"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Documentos
                  </Link>
                  <Link
                    href="/dashboard/training"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Entrenamiento
                  </Link>
                  <Link
                    href="/dashboard/analytics"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Análisis
                  </Link>
                  <Link
                    href="/dashboard/subject-analytics"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Materias
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {user.role === "student" ? "Estudiante" : user.role === "teacher" ? "Profesor" : "Admin"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout()
                router.push("/")
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        {!isMobile && (
          <aside className="hidden md:flex w-64 flex-col border-r px-4 py-6">
            <NavItems />
          </aside>
        )}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}

function NavLink({ href, icon, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
        "hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
