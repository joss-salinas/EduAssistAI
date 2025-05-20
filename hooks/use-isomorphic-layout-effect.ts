import { useEffect, useLayoutEffect } from "react"

// Usar useLayoutEffect en el cliente y useEffect en el servidor
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
