"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BookOpen } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import type { SubjectInfo } from "@/lib/subject-analytics-service"

interface SubjectSelectorProps {
  onSubjectChange: (subjectId: number) => void
}

export function SubjectSelector({ onSubjectChange }: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/subjects/list?teacherId=${user.id}`)

        if (!response.ok) {
          throw new Error("Error al obtener materias")
        }

        const result = await response.json()

        if (result.status === "success") {
          setSubjects(result.data)
          if (result.data.length > 0) {
            setSelectedSubject(result.data[0].id.toString())
            onSubjectChange(result.data[0].id)
          }
        } else {
          throw new Error(result.message || "Error desconocido")
        }
      } catch (err) {
        console.error("Error al cargar materias:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubjects()
  }, [user, onSubjectChange])

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value)
    onSubjectChange(Number.parseInt(value))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Seleccionar Materia
        </CardTitle>
        <CardDescription>Elige una materia para ver su análisis detallado</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-destructive">{error}</div>
        ) : subjects.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">No tienes materias asignadas</div>
        ) : (
          <Select value={selectedSubject} onValueChange={handleSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una materia" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{subject.name}</span>
                    {subject.isCoordinator && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Coordinador
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  )
}
