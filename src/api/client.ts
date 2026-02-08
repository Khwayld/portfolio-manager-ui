const API_BASE_URL = import.meta.env.VITE_API_URL || ""

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

function keysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(keysToCamel)
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        snakeToCamel(k),
        keysToCamel(v),
      ])
    )
  }
  return obj
}

function keysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(keysToSnake)
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        camelToSnake(k),
        keysToSnake(v),
      ])
    )
  }
  return obj
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token")
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...headers,
      },
      body: body ? JSON.stringify(keysToSnake(body)) : undefined,
    })
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Unable to connect to server")
  }

  if (!response.ok) {
    let errorBody: { error?: { code?: string; message?: string } } = {}
    try {
      errorBody = await response.json()
    } catch {
      // ignore parse error
    }
    throw new ApiError(
      response.status,
      errorBody.error?.code || "UNKNOWN",
      errorBody.error?.message || response.statusText
    )
  }

  if (response.status === 204) return undefined as T

  const json = await response.json()
  const data = json.data !== undefined ? json.data : json
  return keysToCamel(data) as T
}

export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: "POST", body }),
  patch: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: "PATCH", body }),
  delete: <T>(endpoint: string) =>
    apiClient<T>(endpoint, { method: "DELETE" }),
}
