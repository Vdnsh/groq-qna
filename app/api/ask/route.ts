import { NextRequest, NextResponse } from 'next/server'
import { startTimer, endTimer } from '@/lib/log'

export async function POST(request: NextRequest) {
  const timerId = startTimer('text', { endpoint: '/api/ask' })
  
  try {
    const body = await request.json()
    const { question } = body

    // Validate question
    if (!question || typeof question !== 'string' || !question.trim()) {
      endTimer(timerId, {
        status: 'error',
        error: 'Question is required',
      })
      return NextResponse.json(
        { error: 'Question is required' },
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
      console.error('GROQ_API_KEY is not set or is empty in environment variables')
      return NextResponse.json(
        { error: 'API key not configured. Please add GROQ_API_KEY to .env.local and restart the server.' },
        { status: 500 }
      )
    }

    // Log the request
    console.log('GROQ REQUEST:', question)

    // Prepare request body for Groq API
    const requestBody = {
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
    }

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const rawResponse = await response.json()

    // Log the full raw response
    console.log('GROQ RAW RESPONSE:', JSON.stringify(rawResponse, null, 2))

    if (!response.ok) {
      const errorMessage = rawResponse.error?.message || 'Failed to get response from Groq'
      endTimer(timerId, {
        status: 'error',
        error: errorMessage,
        metadata: {
          statusCode: response.status,
          groqError: rawResponse.error,
        },
      })
      console.error('Groq API error:', rawResponse)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    // Extract answer and usage from response
    const answer = rawResponse.choices?.[0]?.message?.content || 'No answer received'
    const usage = rawResponse.usage || {}

    // End timer with performance data
    endTimer(timerId, {
      status: 'success',
      tokens: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
      },
      textLength: answer.length,
      metadata: {
        model: rawResponse.model,
        finishReason: rawResponse.choices?.[0]?.finish_reason,
      },
    })

    return NextResponse.json({ answer })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    endTimer(timerId, {
      status: 'error',
      error: errorMessage,
      metadata: {
        stack: error instanceof Error ? error.stack : undefined,
      },
    })
    console.error('Error in /api/ask:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

