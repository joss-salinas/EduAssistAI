/**
 * Utilidades para optimizar el rendimiento de gráficos con grandes conjuntos de datos
 */

/**
 * Agrega datos por período de tiempo (día, semana, mes)
 */
export function aggregateDataByTime<T extends Record<string, any>>(
  data: T[],
  dateField: keyof T,
  valueFields: (keyof T)[],
  period: "day" | "week" | "month" = "day",
): Array<T & { date: string }> {
  if (!data.length) return []

  // Crear un mapa para agrupar por período
  const groupedData = new Map<string, { count: number; values: Record<string, number> }>()

  // Función para obtener la clave de agrupación según el período
  const getGroupKey = (date: Date): string => {
    if (period === "day") {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    } else if (period === "week") {
      // Obtener el primer día de la semana (domingo = 0)
      const firstDayOfWeek = new Date(date)
      const day = date.getDay()
      const diff = date.getDate() - day
      firstDayOfWeek.setDate(diff)
      return `${firstDayOfWeek.getFullYear()}-W${Math.ceil((firstDayOfWeek.getDate() + 1 + new Date(firstDayOfWeek.getFullYear(), 0, 1).getDay()) / 7)}`
    } else {
      // Mes
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    }
  }

  // Agrupar datos
  data.forEach((item) => {
    const date = new Date(item[dateField] as string)
    const key = getGroupKey(date)

    if (!groupedData.has(key)) {
      groupedData.set(key, {
        count: 0,
        values: valueFields.reduce((acc, field) => ({ ...acc, [field as string]: 0 }), {}),
      })
    }

    const group = groupedData.get(key)!
    group.count++

    valueFields.forEach((field) => {
      const value = Number(item[field]) || 0
      group.values[field as string] += value
    })
  })

  // Convertir el mapa a un array de resultados
  return Array.from(groupedData.entries())
    .map(([key, group]) => {
      const result: Record<string, any> = {
        date: key,
      }

      valueFields.forEach((field) => {
        result[field as string] = group.values[field as string] / group.count
      })

      return result as T & { date: string }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Reduce la cantidad de puntos de datos mediante muestreo
 */
export function sampleData<T>(data: T[], sampleSize: number): T[] {
  if (data.length <= sampleSize) return data

  const result: T[] = []
  const step = Math.floor(data.length / sampleSize)

  for (let i = 0; i < data.length; i += step) {
    result.push(data[i])
  }

  // Asegurarse de incluir el último punto
  if (result.length < sampleSize) {
    result.push(data[data.length - 1])
  }

  return result
}

/**
 * Aplica un algoritmo de simplificación de líneas para reducir puntos
 * Implementación del algoritmo de Ramer-Douglas-Peucker
 */
export function simplifyLineData<T extends { [key: string]: any }>(
  data: T[],
  xField: keyof T,
  yField: keyof T,
  epsilon = 1,
): T[] {
  if (data.length <= 2) return data

  // Función para calcular la distancia perpendicular de un punto a una línea
  const perpendicularDistance = (point: T, lineStart: T, lineEnd: T): number => {
    const x = Number(point[xField])
    const y = Number(point[yField])
    const x1 = Number(lineStart[xField])
    const y1 = Number(lineStart[yField])
    const x2 = Number(lineEnd[xField])
    const y2 = Number(lineEnd[yField])

    // Si los puntos de la línea son iguales, devolver la distancia al punto
    if (x1 === x2 && y1 === y2) {
      return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2))
    }

    const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1)
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2))

    return numerator / denominator
  }

  // Implementación recursiva del algoritmo
  const rdp = (startIndex: number, endIndex: number): T[] => {
    if (endIndex - startIndex <= 1) {
      return [data[startIndex]]
    }

    let maxDistance = 0
    let maxIndex = 0

    for (let i = startIndex + 1; i < endIndex; i++) {
      const distance = perpendicularDistance(data[i], data[startIndex], data[endIndex])
      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }

    if (maxDistance > epsilon) {
      const firstPart = rdp(startIndex, maxIndex)
      const secondPart = rdp(maxIndex, endIndex)

      // Combinar los resultados (evitando duplicar el punto de unión)
      return [...firstPart, ...secondPart.slice(1)]
    } else {
      return [data[startIndex], data[endIndex]]
    }
  }

  return rdp(0, data.length - 1)
}

/**
 * Calcula estadísticas para un conjunto de datos
 */
export function calculateDataStatistics<T>(
  data: T[],
  valueField: keyof T,
): { min: number; max: number; avg: number; sum: number; count: number } {
  if (!data.length) {
    return { min: 0, max: 0, avg: 0, sum: 0, count: 0 }
  }

  let min = Number.MAX_VALUE
  let max = Number.MIN_VALUE
  let sum = 0

  data.forEach((item) => {
    const value = Number(item[valueField]) || 0
    min = Math.min(min, value)
    max = Math.max(max, value)
    sum += value
  })

  return {
    min,
    max,
    avg: sum / data.length,
    sum,
    count: data.length,
  }
}
