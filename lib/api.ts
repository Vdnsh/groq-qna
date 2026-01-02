/**
 * Client-side API wrappers
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
  question?: string // Legacy single-turn
  messages?: Array<{ role: string; content: string }> // Multi-turn
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

/**
 * Call the /api/tts endpoint
 */
export async function generateTTS(text: string, voice: string): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate speech' }))
    throw new Error(error.error || 'Failed to generate speech')
  }

  return response.blob()
}

