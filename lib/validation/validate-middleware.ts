import type { NextRequest } from "next/server"
import { z } from "zod"

/**
 * Valida los datos de una petición contra un esquema Zod
 */
export async function validateRequest<T extends z.ZodType>(
  req: NextRequest,
  schema: T,
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: z.ZodError }> {
  try {
    // Clone the request to avoid consuming the body
    const clonedReq = req.clone()

    // Try to parse the body as JSON
    let data
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      try {
        data = await clonedReq.json()
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError)
        const zodError = new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: ["body"],
            message: "Error al parsear el cuerpo de la petición como JSON",
          },
        ])
        return {
          success: false,
          error: zodError,
        }
      }
    } else {
      // For non-JSON content types, try to get form data
      try {
        const formData = await clonedReq.formData()
        data = Object.fromEntries(formData.entries())
      } catch (formError) {
        console.error("Form data parsing error:", formError)
        const zodError = new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: ["body"],
            message: "Error al parsear el cuerpo de la petición como FormData",
          },
        ])
        return {
          success: false,
          error: zodError,
        }
      }
    }

    // Validate the data against the schema
    const validatedData = schema.safeParse(data)

    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error,
      }
    }

    return {
      success: true,
      data: validatedData.data,
    }
  } catch (error) {
    console.error("Unexpected error in validateRequest:", error)
    // If there's an unexpected error, create a generic Zod error
    const zodError = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["body"],
        message: "Error inesperado al procesar la petición",
      },
    ])

    return {
      success: false,
      error: zodError,
    }
  }
}
