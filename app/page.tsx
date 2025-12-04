'use client'

import { useState } from 'react'

export default function Home() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    setLoading(true)
    setError(null)
    setAnswer('')

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer')
      }

      setAnswer(data.answer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        background: '#1e293b',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: '#f1f5f9',
        }}>
          Groq QnA Playground
        </h1>

        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your question here..."
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '1rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '1rem',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              background: loading ? '#475569' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s, transform 0.1s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#3b82f6'
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {loading ? 'Connecting to Groq...' : 'Ask Groq'}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#7f1d1d',
            border: '1px solid #991b1b',
            borderRadius: '8px',
            color: '#fecaca',
          }}>
            <strong>Error:</strong> {error}
            {error.includes('API key') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Please add your GROQ_API_KEY to the <code style={{ background: '#991b1b', padding: '0.125rem 0.25rem', borderRadius: '4px' }}>.env.local</code> file in the project root.
              </div>
            )}
          </div>
        )}

        {answer && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#f1f5f9',
            }}>
              Answer:
            </h2>
            <div style={{
              color: '#cbd5e1',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {answer}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

