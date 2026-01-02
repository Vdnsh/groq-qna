/**
 * Client-side utilities for calling Groq API endpoints
 */

export interface AskResponse {
  answer: string
  tokens?: {
    prompt?: number
    completion?: number
    total?: number
  }
}

export interface AskRequest {
  question?: string // Single-turn (backward compatible)
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> // Multi-turn
}

/**
 * Call the /api/ask endpoint
 */
export async function askGroq(request: AskRequest): Promise<AskResponse> {
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get response from Groq')
  }

  return data
}

