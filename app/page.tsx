'use client'

import { useState, useEffect, useRef } from 'react'
import { DEFAULT_VOICE, GROQ_TTS_VOICES, VOICE_NAMES, type GroqTTSVoice } from '@/config/tts'

interface PerformanceLog {
  type: 'text' | 'tts'
  startTime: number
  endTime?: number
  duration?: number
  status: 'pending' | 'success' | 'error'
  tokens?: {
    prompt?: number
    completion?: number
    total?: number
  }
  audioSize?: number
  textLength?: number
  error?: string
  metadata?: Record<string, any>
}

export default function Home() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoadingTTS, setIsLoadingTTS] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<GroqTTSVoice>(DEFAULT_VOICE)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<PerformanceLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Load voice preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVoice = localStorage.getItem('groq_tts_voice') as GroqTTSVoice
      if (savedVoice && Object.values(GROQ_TTS_VOICES).includes(savedVoice)) {
        setSelectedVoice(savedVoice)
      }
    }
  }, [])

  // Split text into chunks (approximately 3000 characters per chunk to stay under token limits)
  const splitTextIntoChunks = (text: string, maxChunkSize: number = 3000): string[] => {
    const chunks: string[] = []
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    
    let currentChunk = ''
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        currentChunk += sentence
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }
    
    return chunks.length > 0 ? chunks : [text]
  }

  const playAudioChunk = async (chunk: string, chunkIndex: number, totalChunks: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: chunk,
          voice: selectedVoice,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            let errorMessage = `Failed to generate speech (${response.status})`
            try {
              const contentType = response.headers.get('content-type')
              if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json() as { error?: string }
                errorMessage = errorData.error || errorMessage
              } else {
                const errorText = await response.text()
                errorMessage = errorText || errorMessage
              }
            } catch (e) {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`
            }
            throw new Error(errorMessage)
          }

          const blob = await response.blob()
          const audioUrl = URL.createObjectURL(blob)
          const audio = new Audio(audioUrl)

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            resolve()
          }

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            reject(new Error('Audio playback failed'))
          }

          await audio.play()
          audioRef.current = audio
        })
        .catch(reject)
    })
  }

  const playGroqTTS = async (text: string) => {
    // Stop any ongoing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsSpeaking(false)
    }

    // If already speaking, stop it
    if (isSpeaking) {
      setIsSpeaking(false)
      return
    }

    setIsLoadingTTS(true)
    setError(null)

    try {
      // First, try to play the full text
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
        }),
      })

      if (!response.ok) {
        let errorMessage = `Failed to generate speech (${response.status})`
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json() as { error?: string }
            errorMessage = errorData.error || errorMessage
          } else {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        // If error is about text being too large, split it into chunks
        if (errorMessage.includes('Request too large') || errorMessage.includes('tokens per day') || errorMessage.includes('TPD')) {
          console.log('Text too large, splitting into chunks...')
          const chunks = splitTextIntoChunks(text, 2500) // Use smaller chunks to be safe
          
          setIsLoadingTTS(false)
          setIsSpeaking(true)
          
          // Play chunks sequentially
          for (let i = 0; i < chunks.length; i++) {
            try {
              await playAudioChunk(chunks[i], i, chunks.length)
            } catch (chunkError) {
              console.error(`Error playing chunk ${i + 1}:`, chunkError)
              setIsSpeaking(false)
              setIsLoadingTTS(false)
              setError(`Failed to play part ${i + 1} of ${chunks.length}. ${chunkError instanceof Error ? chunkError.message : 'Please try again.'}`)
              return
            }
          }
          
          setIsSpeaking(false)
          setIsLoadingTTS(false)
          return
        }
        
        console.error('TTS API error:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
        })
        
        throw new Error(errorMessage)
      }

      // Get audio as blob
      const blob = await response.blob()
      
      // Clean up previous URL if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }

      // Create object URL
      const audioUrl = URL.createObjectURL(blob)
      audioUrlRef.current = audioUrl

      // Create and play audio
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => {
        setIsSpeaking(true)
        setIsLoadingTTS(false)
      }

      audio.onended = () => {
        setIsSpeaking(false)
        setIsLoadingTTS(false)
        // Clean up URL after playback
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        audioRef.current = null
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        setIsLoadingTTS(false)
        setError('Voice playback failed. Please try again.')
        audioRef.current = null
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
      }

      await audio.play()
    } catch (err) {
      console.error('TTS error:', err)
      setIsLoadingTTS(false)
      setIsSpeaking(false)
      setError(err instanceof Error ? err.message : 'Voice playback is temporarily unavailable.')
    }
  }

  const handleVoiceChange = (voice: GroqTTSVoice) => {
    setSelectedVoice(voice)
    if (typeof window !== 'undefined') {
      localStorage.setItem('groq_tts_voice', voice)
    }
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsSpeaking(false)
    }
  }

  // Fetch logs
  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const response = await fetch('/api/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Fetch logs when modal opens
  useEffect(() => {
    if (showLogs) {
      fetchLogs()
      // Refresh logs every 2 seconds while modal is open
      const interval = setInterval(fetchLogs, 2000)
      return () => clearInterval(interval)
    }
  }, [showLogs])

  // Clear logs
  const clearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' })
      setLogs([])
    } catch (err) {
      console.error('Failed to clear logs:', err)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
    }
  }, [])

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
        position: 'relative',
      }}>
        {/* Log Icon Button */}
        <button
          onClick={() => setShowLogs(true)}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: '#334155',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#475569'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#334155'
          }}
          title="View performance logs"
        >
          <span style={{ fontSize: '1.25rem' }}>📊</span>
        </button>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: '#f1f5f9',
        }}>
          Groq QnA Playground
        </h1>

        {/* Voice Selection */}
        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}>
          <label style={{
            fontSize: '0.875rem',
            color: '#cbd5e1',
          }}>
            Voice:
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => handleVoiceChange(e.target.value as GroqTTSVoice)}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '0.375rem 0.75rem',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {Object.entries(VOICE_NAMES).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </div>

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
            {error.includes('terms acceptance') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <a 
                  href="https://console.groq.com/playground?model=playai-tts" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#fecaca', 
                    textDecoration: 'underline',
                    fontWeight: '600',
                  }}
                >
                  Click here to accept the terms →
                </a>
              </div>
            )}
            {(error.includes('tokens per day') || error.includes('TPD') || error.includes('Request too large')) && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  Long answers will be split into smaller parts automatically.
                </div>
                <a 
                  href="https://console.groq.com/settings/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#fecaca', 
                    textDecoration: 'underline',
                    fontWeight: '600',
                  }}
                >
                  Upgrade for higher limits →
                </a>
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f1f5f9',
                margin: 0,
              }}>
                Answer:
              </h2>
              <button
                type="button"
                onClick={() => playGroqTTS(answer)}
                disabled={isLoadingTTS}
                style={{
                  background: isSpeaking ? '#ef4444' : isLoadingTTS ? '#475569' : '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isLoadingTTS ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s',
                  opacity: isLoadingTTS ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSpeaking && !isLoadingTTS) {
                    e.currentTarget.style.background = '#475569'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSpeaking && !isLoadingTTS) {
                    e.currentTarget.style.background = '#334155'
                  }
                }}
                title={isSpeaking ? 'Stop reading' : isLoadingTTS ? 'Loading...' : 'Read aloud'}
              >
                {isLoadingTTS ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                    <span>Loading...</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <span>⏹</span>
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <span>🔊</span>
                    <span>Read</span>
                  </>
                )}
              </button>
            </div>
            <div style={{
              color: '#cbd5e1',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {answer}
            </div>
            {(isSpeaking || isLoadingTTS) && (
              <div style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: isLoadingTTS ? '#94a3b8' : '#3b82f6',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isLoadingTTS ? '#94a3b8' : '#3b82f6',
                  animation: isLoadingTTS ? 'none' : 'pulse 1.5s ease-in-out infinite',
                }}></span>
                {isLoadingTTS ? 'Generating voice...' : 'Reading aloud...'}
              </div>
            )}
          </div>
        )}

        {/* Logs Modal */}
        {showLogs && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowLogs(false)
              }
            }}
          >
            <div
              style={{
                background: '#1e293b',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#f1f5f9',
                  margin: 0,
                }}>
                  Performance Logs
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={clearLogs}
                    style={{
                      background: '#7f1d1d',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      color: '#fecaca',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#991b1b'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#7f1d1d'
                    }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowLogs(false)}
                    style={{
                      background: '#334155',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      color: '#e2e8f0',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#475569'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#334155'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Logs Content */}
              <div style={{
                padding: '1.5rem',
                overflowY: 'auto',
                flex: 1,
              }}>
                {loadingLogs ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    Loading logs...
                  </div>
                ) : logs.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No logs yet. Make some requests to see performance data.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        style={{
                          background: log.status === 'error' ? '#7f1d1d' : '#0f172a',
                          border: `1px solid ${log.status === 'error' ? '#991b1b' : '#334155'}`,
                          borderRadius: '8px',
                          padding: '1rem',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.75rem',
                        }}>
                          <span style={{ fontSize: '1.25rem' }}>
                            {log.type === 'text' ? '📝' : '🔊'}
                          </span>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#f1f5f9',
                            textTransform: 'uppercase',
                          }}>
                            {log.type}
                          </span>
                          <span style={{
                            fontSize: '0.875rem',
                            color: log.status === 'success' ? '#86efac' : '#fca5a5',
                          }}>
                            {log.status === 'success' ? '✅ Success' : '❌ Error'}
                          </span>
                          {log.duration && (
                            <span style={{
                              fontSize: '0.875rem',
                              color: '#94a3b8',
                              marginLeft: 'auto',
                            }}>
                              {log.duration.toFixed(2)}ms
                            </span>
                          )}
                        </div>

                        {log.type === 'text' && log.tokens && (
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#cbd5e1',
                            marginTop: '0.5rem',
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap',
                          }}>
                            {log.tokens.prompt && (
                              <span>Prompt: <strong>{log.tokens.prompt}</strong></span>
                            )}
                            {log.tokens.completion && (
                              <span>Completion: <strong>{log.tokens.completion}</strong></span>
                            )}
                            {log.tokens.total && (
                              <span>Total: <strong>{log.tokens.total}</strong></span>
                            )}
                          </div>
                        )}

                        {log.type === 'tts' && (
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#cbd5e1',
                            marginTop: '0.5rem',
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap',
                          }}>
                            {log.audioSize && (
                              <span>Size: <strong>{(log.audioSize / 1024).toFixed(2)} KB</strong></span>
                            )}
                            {log.textLength && (
                              <span>Text: <strong>{log.textLength}</strong> chars</span>
                            )}
                            {log.metadata?.voice && (
                              <span>Voice: <strong>{log.metadata.voice}</strong></span>
                            )}
                          </div>
                        )}

                        {log.error && (
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#fca5a5',
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '4px',
                          }}>
                            {log.error}
                          </div>
                        )}

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details style={{ marginTop: '0.5rem' }}>
                            <summary style={{
                              fontSize: '0.875rem',
                              color: '#94a3b8',
                              cursor: 'pointer',
                            }}>
                              Metadata
                            </summary>
                            <pre style={{
                              fontSize: '0.75rem',
                              color: '#cbd5e1',
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(0, 0, 0, 0.3)',
                              borderRadius: '4px',
                              overflow: 'auto',
                            }}>
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

