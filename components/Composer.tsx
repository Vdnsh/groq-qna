'use client'

import { useState, useRef, useEffect } from 'react'
import VoiceToTextModal from './VoiceToTextModal'

interface ComposerProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export default function Composer({ onSend, disabled = false }: ComposerProps) {
  const [input, setInput] = useState('')
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    
    onSend(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  return (
    <form className="composer-pill" onSubmit={handleSubmit}>
      <button type="button" className="composer-icon composer-plus" aria-label="Attach">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything"
        disabled={disabled}
        className="composer-input"
        rows={1}
      />
      <button type="button" className="composer-icon composer-attach" aria-label="Attach file">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6" y="6" width="4" height="4" rx="0.5" fill="currentColor" />
        </svg>
      </button>
      <button 
        type="button" 
        className="composer-icon composer-mic" 
        aria-label="Voice input"
        onClick={() => setShowVoiceModal(true)}
        title="Voice to text"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1v4M8 11v4M4 6h8M6 6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <button type="submit" className="composer-voice-button" aria-label="Send" disabled={!input.trim() || disabled}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="2" y="4" width="12" height="8" rx="1" />
          <rect x="5" y="2" width="6" height="2" />
          <rect x="6" y="12" width="4" height="2" />
          <line x1="4" y1="6" x2="4" y2="10" stroke="white" strokeWidth="1" />
          <line x1="6" y1="6" x2="6" y2="10" stroke="white" strokeWidth="1" />
          <line x1="8" y1="6" x2="8" y2="10" stroke="white" strokeWidth="1" />
          <line x1="10" y1="6" x2="10" y2="10" stroke="white" strokeWidth="1" />
          <line x1="12" y1="6" x2="12" y2="10" stroke="white" strokeWidth="1" />
        </svg>
      </button>
      <VoiceToTextModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onTranscript={(text) => {
          setInput(text)
          setShowVoiceModal(false)
          // Focus the textarea after setting text
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus()
              textareaRef.current.setSelectionRange(text.length, text.length)
            }
          }, 0)
        }}
      />
    </form>
  )
}

