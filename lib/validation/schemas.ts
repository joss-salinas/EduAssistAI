import { z } from "zod"

// Esquema para validar los datos de entrada al enviar un mensaje a Rasa
export const sendMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().optional().default("default"),
})

// Esquema para validar las respuestas de Rasa
export const rasaResponseSchema = z.array(
  z.object({
    recipient_id: z.string(),
    text: z.string().optional(),
    image: z.string().url().optional(),
    buttons: z
      .array(
        z.object({
          title: z.string(),
          payload: z.string(),
        }),
      )
      .optional(),
    custom: z.any().optional(),
  }),
)
