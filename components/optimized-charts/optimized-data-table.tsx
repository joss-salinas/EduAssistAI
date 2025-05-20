"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useVirtualizer } from "@tanstack/react-virtual"

interface Column<T> {
  header: string
  accessorKey: keyof T
  cell?: (value: any, row: T) => React.ReactNode
}

interface OptimizedDataTableProps<T extends Record<string, any>> {
  title: string
  description: string
  fetchFn: () => Promise<T[]>
  columns: Column<T>[]
  icon?: React.ReactNode
  className?: string
  pageSize?: number
  searchable?: boolean
  searchKeys?: (keyof T)[]
}

export function OptimizedDataTable<T extends Record<string, any>>({
  title,
  description,
  fetchFn,
  columns,
  icon,
  className,
  pageSize = 10,
  searchable = true,
  searchKeys,
}: OptimizedDataTableProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [filteredData, setFilteredData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Referencia para la virtualización
  const parentRef = React.useRef<HTMLDivElement>(null)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const result = await fetchFn()
        setData(result)
        setFilteredData(result)
        setError(null)
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fetchFn])

  // Filtrar datos cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data)
      setCurrentPage(1)
      return
    }

    const keysToSearch = searchKeys || (Object.keys(data[0] || {}) as (keyof T)[])

    const filtered = data.filter((item) =>
      keysToSearch.some((key) => {
        const value = item[key]
        return value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
      }),
    )

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, data, searchKeys])

  // Configurar virtualizador para renderizar solo las filas visibles
  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // altura estimada de cada fila
    overscan: 10, // número de elementos a renderizar fuera de la vista
  })

  // Calcular el número total de páginas
  const totalPages = Math.ceil(filteredData.length / pageSize)

  // Obtener los datos para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredData.length)
  const currentPageData = filteredData.slice(startIndex, endIndex)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div className="flex items-center gap-2">
            {icon && <span>{icon}</span>}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {searchable && data.length > 0 && (
            <div className="w-full md:w-64">
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-destructive">Error: {error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <>
            <div ref={parentRef} className="h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.header}>{column.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column) => (
                        <TableCell key={`${rowIndex}-${column.accessorKey as string}`}>
                          {column.cell
                            ? column.cell(row[column.accessorKey], row)
                            : String(row[column.accessorKey] || "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
