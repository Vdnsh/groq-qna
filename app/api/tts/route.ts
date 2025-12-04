import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_VOICE } from '@/config/tts'
import { startTimer, endTimer } from '@/lib/log'

export async function POST(request: NextRequest) {
  const timerId = startTimer('tts', { endpoint: '/api/tts' })
  
  try {
    const body = await request.json()
    const { text, voice } = body

    // Validate text
    if (!text || typeof text !== 'string' || !text.trim()) {
      endTimer(timerId, {
        status: 'error',
        error: 'Text is required',
      })
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey.trim().length === 0) {
      endTimer(timerId, {
        status: 'error',
        error: 'GROQ_API_KEY is not set',
      })
      console.error('GROQ_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'API key not configured. Please add GROQ_API_KEY to .env.local and restart the server.' },
        { status: 500 }
      )
    }

    // Use provided voice or default to Celeste-PlayAI
    const selectedVoice = voice || DEFAULT_VOICE

    // Log the request
    console.log('GROQ TTS REQUEST', {
      textSnippet: text.slice(0, 120),
      voice: selectedVoice,
    })

    // Prepare request body for Groq TTS API
    const requestBody = {
      model: 'playai-tts',
      voice: selectedVoice,
      input: text,
      response_format: 'wav',
    }

    // Call Groq TTS API
    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('GROQ TTS STATUS', response.status)
    console.log('GROQ TTS HEADERS', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorText = ''
      let errorJson = null
      
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          errorJson = await response.json()
          errorText = JSON.stringify(errorJson, null, 2)
        } else {
          errorText = await response.text()
        }
      } catch (e) {
        errorText = `Failed to read error response: ${e}`
      }

      console.error('Groq TTS API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        requestBody: JSON.stringify(requestBody, null, 2),
      })

      // Return more specific error message
      let errorMessage = errorJson?.error?.message || errorJson?.error || ''
      
      // Handle specific error cases
      if (errorMessage.includes('terms acceptance') || errorMessage.includes('requires terms')) {
        errorMessage = 'The TTS model requires terms acceptance. Please visit https://console.groq.com/playground?model=playai-tts to accept the terms.'
      } else if (errorMessage.includes('Request too large') || errorMessage.includes('tokens per day') || errorMessage.includes('TPD')) {
        errorMessage = 'Text is too long for TTS. The answer will be split into smaller parts. If you need higher limits, upgrade at https://console.groq.com/settings/billing'
      } else if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your GROQ_API_KEY.'
      } else if (response.status === 400) {
        errorMessage = errorMessage || 'Invalid request. Please check the text and voice parameters.'
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else if (!errorMessage) {
        errorMessage = 'Failed to generate speech. Please try again.'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      )
    }

    // Check content type to ensure we got audio
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('audio') && !contentType.includes('wav')) {
      const errorText = await response.text()
      console.error('Unexpected content type from Groq TTS:', {
        contentType,
        responsePreview: errorText.slice(0, 200),
      })
      return NextResponse.json(
        { error: 'Unexpected response format from TTS service.' },
        { status: 500 }
      )
    }

    // Get the audio as array buffer
    const audioBuffer = await response.arrayBuffer()

    console.log('GROQ TTS SUCCESS', {
      audioSize: audioBuffer.byteLength,
      contentType,
    })

    // End timer with performance data
    endTimer(timerId, {
      status: 'success',
      audioSize: audioBuffer.byteLength,
      textLength: text.length,
      metadata: {
        voice: selectedVoice,
        contentType,
      },
    })

    // Return the audio with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'audio/wav',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    endTimer(timerId, {
      status: 'error',
      error: errorMessage,
      metadata: {
        stack: error instanceof Error ? error.stack : undefined,
      },
    })
    console.error('Error in /api/tts:', error)
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

