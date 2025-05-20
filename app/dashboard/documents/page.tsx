"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Plus, Search, MoreVertical, Download, Trash, Edit, FileUp } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Document = {
  id: string
  name: string
  category: string
  uploadedBy: string
  uploadDate: Date
  size: string
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Calendario Académico 2023-2024.pdf",
    category: "Administrativo",
    uploadedBy: "Admin",
    uploadDate: new Date(2023, 7, 15),
    size: "1.2 MB",
  },
  {
    id: "2",
    name: "Reglamento Estudiantil.pdf",
    category: "Normativa",
    uploadedBy: "Admin",
    uploadDate: new Date(2023, 6, 20),
    size: "3.5 MB",
  },
  {
    id: "3",
    name: "Horarios de Exámenes Finales.xlsx",
    category: "Académico",
    uploadedBy: "Profesor García",
    uploadDate: new Date(2023, 10, 5),
    size: "0.8 MB",
  },
  {
    id: "4",
    name: "Guía de Servicios Estudiantiles.pdf",
    category: "Servicios",
    uploadedBy: "Admin",
    uploadDate: new Date(2023, 9, 12),
    size: "2.1 MB",
  },
  {
    id: "5",
    name: "Protocolo de Emergencias.pdf",
    category: "Seguridad",
    uploadedBy: "Admin",
    uploadDate: new Date(2023, 8, 30),
    size: "1.5 MB",
  },
]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuth()

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleUpload = () => {
    setIsUploading(true)
    // Simular carga
    setTimeout(() => {
      setIsUploading(false)
      // Aquí se añadiría el documento a la lista
    }, 2000)
  }

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Documentos</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Documento</DialogTitle>
              <DialogDescription>Sube un documento para entrenar al asistente virtual</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="document-name">Nombre del Documento</Label>
                <Input id="document-name" placeholder="Ej: Calendario Académico 2023-2024" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document-category">Categoría</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Académico</SelectItem>
                    <SelectItem value="administrative">Administrativo</SelectItem>
                    <SelectItem value="normative">Normativa</SelectItem>
                    <SelectItem value="services">Servicios</SelectItem>
                    <SelectItem value="security">Seguridad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document-description">Descripción</Label>
                <Textarea id="document-description" placeholder="Breve descripción del contenido del documento" />
              </div>
              <div className="grid gap-2">
                <Label>Archivo</Label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra y suelta archivos aquí o haz clic para seleccionar
                  </p>
                  <Input type="file" className="hidden" id="file-upload" />
                  <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                    Seleccionar Archivo
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Subiendo..." : "Subir Documento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="academic">Académicos</TabsTrigger>
          <TabsTrigger value="administrative">Administrativos</TabsTrigger>
          <TabsTrigger value="normative">Normativos</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Subido por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No se encontraron documentos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>{doc.category}</TableCell>
                        <TableCell>{doc.uploadedBy}</TableCell>
                        <TableCell>{doc.uploadDate.toLocaleDateString()}</TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(doc.id)}>
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p>Documentos académicos filtrados aquí</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="administrative" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p>Documentos administrativos filtrados aquí</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="normative" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p>Documentos normativos filtrados aquí</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
