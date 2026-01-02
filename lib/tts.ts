/**
 * TTS synthesis helper
 * Calls /api/tts and returns a playable audio URL
 */

/**
 * Synthesize TTS and return a playable blob URL
 */
export async function synthesizeTTS(text: string, voice: string): Promise<string> {
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

  // API returns binary audio (audio/wav)
  const blob = await response.blob()
  const audioUrl = URL.createObjectURL(blob)
  
  return audioUrl
}

