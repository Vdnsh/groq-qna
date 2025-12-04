import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Debug: Check all env vars that start with GROQ
    const allEnvVars = Object.keys(process.env).filter(key => key.includes('GROQ'))
    console.log('Environment variables with GROQ:', allEnvVars)
    console.log('process.env.GROQ_API_KEY exists:', 'GROQ_API_KEY' in process.env)
    console.log('process.env.GROQ_API_KEY value length:', process.env.GROQ_API_KEY?.length || 0)
    
    const apiKey = process.env.GROQ_API_KEY
    
    // Check if API key is loaded
    const hasApiKey = !!apiKey && apiKey.trim().length > 0
    console.log('GROQ_API_KEY loaded:', hasApiKey)
    
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json({
        error: 'GROQ_API_KEY is not set in environment variables',
        hasApiKey: false,
        debug: {
          envVarExists: 'GROQ_API_KEY' in process.env,
          valueLength: process.env.GROQ_API_KEY?.length || 0,
          allGroqVars: allEnvVars,
        },
        instructions: 'Please add your GROQ_API_KEY to the .env.local file in the project root and restart the dev server (npm run dev)',
      }, { status: 500 })
    }

    // Make a minimal test request to Groq
    const testRequestBody = {
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: 'Say hello from Groq',
        },
      ],
    }

    console.log('Test request to Groq:', JSON.stringify(testRequestBody, null, 2))

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequestBody),
    })

    const rawResponse = await response.json()
    console.log('Groq test response:', JSON.stringify(rawResponse, null, 2))

    if (!response.ok) {
      console.error('Groq API test error:', rawResponse)
      return NextResponse.json({
        error: rawResponse.error?.message || 'Failed to connect to Groq API',
        hasApiKey: true,
        groqError: rawResponse,
      }, { status: response.status })
    }

    const answer = rawResponse.choices?.[0]?.message?.content || 'No response received'

    return NextResponse.json({
      success: true,
      hasApiKey: true,
      message: 'Successfully connected to Groq API',
      answer: answer,
      fullResponse: rawResponse,
    })
  } catch (error) {
    console.error('Error in /api/test-groq:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error',
      hasApiKey: !!process.env.GROQ_API_KEY,
    }, { status: 500 })
  }
}

