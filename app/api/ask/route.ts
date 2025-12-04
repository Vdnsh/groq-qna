import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question } = body

    // Validate question
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey.trim().length === 0) {
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
      console.error('Groq API error:', rawResponse)
      return NextResponse.json(
        { error: rawResponse.error?.message || 'Failed to get response from Groq' },
        { status: response.status }
      )
    }

    // Extract answer from response
    const answer = rawResponse.choices?.[0]?.message?.content || 'No answer received'

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Error in /api/ask:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

