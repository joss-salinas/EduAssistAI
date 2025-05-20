import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execPromise = promisify(exec)

// Esta ruta API maneja la extracción de texto de documentos
export async function POST(req: Request) {
  try {
    // Verificar que la solicitud es multipart/form-data
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Obtener la extensión del archivo
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    // Verificar que el formato es soportado
    if (!["pdf", "docx", "doc", "txt"].includes(fileExtension || "")) {
      return NextResponse.json({ error: "Formato de archivo no soportado" }, { status: 400 })
    }

    // Convertir el archivo a un Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crear un nombre de archivo temporal
    const tempFilePath = join("/tmp", `upload_${Date.now()}.${fileExtension}`)

    // Guardar el archivo temporalmente
    await writeFile(tempFilePath, buffer)

    // Extraer texto según el tipo de archivo
    let text = ""

    if (fileExtension === "txt") {
      // Para archivos de texto, leer directamente
      text = buffer.toString("utf-8")
    } else if (fileExtension === "pdf") {
      // Para PDFs, usar pdftotext (requiere poppler-utils instalado en el servidor)
      const { stdout } = await execPromise(`pdftotext ${tempFilePath} -`)
      text = stdout
    } else if (fileExtension === "docx" || fileExtension === "doc") {
      // Para documentos Word, usar textract o similar
      // Nota: Esto requiere que textract esté instalado en el servidor
      const { stdout } = await execPromise(`textract ${tempFilePath}`)
      text = stdout
    }

    // Limpiar el texto
    text = text.replace(/\r\n/g, "\n").trim()

    // Devolver el texto extraído
    return NextResponse.json({ text })
  } catch (error) {
    console.error("Error al extraer texto:", error)
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 })
  }
}
