'use client'

import { useState, useEffect, useRef } from 'react'

interface VoiceToTextModalProps {
  isOpen: boolean
  onClose: () => void
  onTranscript: (text: string) => void
}

export default function VoiceToTextModal({ isOpen, onClose, onTranscript }: VoiceToTextModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Cleanup when modal closes
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setIsListening(false)
      setTranscript('')
      setError(null)
      return
    }

    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript + interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please check your microphone settings.')
      } else if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.')
      } else {
        setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [isOpen])

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting recognition:', error)
        setError('Failed to start voice recognition. Please try again.')
      }
    }
  }

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleUseTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim())
      onClose()
    }
  }

  const handleClear = () => {
    setTranscript('')
    setError(null)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content voice-modal">
        <div className="modal-header">
          <h2>Voice to Text</h2>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
        <div className="modal-body">
          <div className="voice-modal-content">
            <div className="voice-status">
              {isListening ? (
                <div className="voice-listening">
                  <div className="voice-pulse"></div>
                  <span>Listening...</span>
                </div>
              ) : (
                <div className="voice-idle">
                  <span>Click the microphone to start</span>
                </div>
              )}
            </div>

            <div className="voice-controls">
              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                className={`voice-mic-button ${isListening ? 'listening' : ''}`}
                disabled={!!error}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1v6M12 17v6M5 12h14M9 12a3 3 0 0 0 6 0" />
                    <path d="M9 12a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <div className="voice-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="voice-transcript">
              <label className="voice-transcript-label">Transcript:</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your speech will appear here..."
                className="voice-transcript-textarea"
                rows={6}
              />
            </div>

            <div className="voice-actions">
              <button onClick={handleClear} className="btn-secondary" disabled={!transcript.trim()}>
                Clear
              </button>
              <button onClick={handleUseTranscript} className="btn-primary" disabled={!transcript.trim()}>
                Use Transcript
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

