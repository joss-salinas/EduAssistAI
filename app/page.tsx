import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { School } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="h-6 w-6" />
            <span className="text-xl font-bold">EduAssistant</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                Inicio
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Acerca de
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Contacto
              </Link>
            </nav>
            <ModeToggle />
            <Button asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Asistente Virtual Inteligente para tu Institución Educativa
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Respuestas instantáneas a preguntas sobre horarios, materias, eventos, docentes y reglamentos.
                  Entrenado por el personal docente y administrativo para brindar información precisa.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/chat">Probar Asistente</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/login">Acceder al Panel</Link>
                  </Button>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex justify-center">
                <div className="relative h-[350px] w-[350px] rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <School className="h-24 w-24 text-primary/40" />
                  </div>
                  <div className="relative z-10 bg-background/95 backdrop-blur-sm rounded-lg p-6 shadow-lg w-[300px]">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <School className="h-4 w-4" />
                        </div>
                        <div className="bg-muted p-3 rounded-lg text-sm">¿En qué puedo ayudarte hoy?</div>
                      </div>
                      <div className="flex items-start gap-4 flex-row-reverse">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                          <span className="text-xs font-medium">TÚ</span>
                        </div>
                        <div className="bg-secondary p-3 rounded-lg text-sm text-secondary-foreground">
                          ¿Cuál es el horario de la biblioteca?
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <School className="h-4 w-4" />
                        </div>
                        <div className="bg-muted p-3 rounded-lg text-sm">
                          La biblioteca está abierta de lunes a viernes de 8:00 AM a 6:00 PM y los sábados de 9:00 AM a
                          1:00 PM.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Características Principales
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nuestro asistente virtual está diseñado para mejorar la experiencia educativa
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <School className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Respuestas Instantáneas</h3>
                <p className="text-center text-muted-foreground">
                  Obtén información sobre horarios, materias, eventos y más de manera inmediata.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <School className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Entrenamiento Continuo</h3>
                <p className="text-center text-muted-foreground">
                  El personal docente actualiza constantemente la información para mantenerla precisa.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <School className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Acceso Multiplataforma</h3>
                <p className="text-center text-muted-foreground">
                  Disponible desde cualquier dispositivo con acceso a internet.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} EduAssistant. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Términos
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
