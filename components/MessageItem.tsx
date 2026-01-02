'use client'

import { useState, useEffect } from 'react'
import type { Message } from '@/lib/types'
import { playFromUrl, stop, isPlaying, onEnded, onError } from '@/lib/ttsPlayer'
import { synthesizeTTS } from '@/lib/tts'
import { getSelectedVoice } from '@/lib/storage'
import { DEFAULT_VOICE } from '@/config/tts'

interface MessageItemProps {
  message: Message
  onPlayingChange?: (messageId: string, playing: boolean) => void
  isCurrentlyPlaying?: boolean
}

export default function MessageItem({ 
  message, 
  onPlayingChange,
  isCurrentlyPlaying = false 
}: MessageItemProps) {
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sync with global playing state
  useEffect(() => {
    if (isCurrentlyPlaying) {
      setTtsStatus('playing')
    } else if (ttsStatus === 'playing' && !isCurrentlyPlaying) {
      setTtsStatus('idle')
    }
  }, [isCurrentlyPlaying, ttsStatus])

  // Set up audio callbacks
  useEffect(() => {
    const handleEnded = () => {
      if (ttsStatus === 'playing' || isCurrentlyPlaying) {
        setTtsStatus('idle')
        if (onPlayingChange) {
          onPlayingChange(message.id, false)
        }
      }
    }

    const handleError = (error: Error) => {
      setTtsStatus('error')
      setErrorMessage(error.message)
      if (onPlayingChange) {
        onPlayingChange(message.id, false)
      }
    }

    const unsubscribeEnded = onEnded(handleEnded)
    const unsubscribeError = onError(handleError)

    return () => {
      unsubscribeEnded()
      unsubscribeError()
    }
  }, [message.id, ttsStatus, isCurrentlyPlaying, onPlayingChange])

  const handleTTS = async () => {
    if (message.role !== 'assistant') return

    // If currently playing, stop it
    if (ttsStatus === 'playing' || isCurrentlyPlaying) {
      stop()
      setTtsStatus('idle')
      setErrorMessage(null)
      if (onPlayingChange) {
        onPlayingChange(message.id, false)
      }
      return
    }

    // Stop any other playing audio first
    stop()
    if (onPlayingChange) {
      onPlayingChange(message.id, true)
    }

    setTtsStatus('loading')
    setErrorMessage(null)

    try {
      const voice = getSelectedVoice() || DEFAULT_VOICE
      const audioUrl = await synthesizeTTS(message.content, voice)
      
      setTtsStatus('playing')
      await playFromUrl(audioUrl)
      
      // Audio ended callback will handle cleanup
    } catch (error) {
      console.error('TTS error:', error)
      setTtsStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate speech')
      if (onPlayingChange) {
        onPlayingChange(message.id, false)
      }
    }
  }

  const isUser = message.role === 'user'

  return (
    <div className={`message-item ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-content">
        <div className="message-text">{message.content}</div>
        {!isUser && (
          <div className="message-tts-wrapper">
            <button
              onClick={handleTTS}
              disabled={ttsStatus === 'loading'}
              className={`message-tts-btn ${ttsStatus === 'playing' ? 'playing' : ''} ${ttsStatus === 'error' ? 'error' : ''}`}
              aria-label={
                ttsStatus === 'playing' ? 'Stop reading' : 
                ttsStatus === 'loading' ? 'Loading...' : 
                'Read aloud'
              }
              title={
                ttsStatus === 'playing' ? 'Stop reading' : 
                ttsStatus === 'loading' ? 'Loading...' : 
                'Read aloud'
              }
            >
              {ttsStatus === 'loading' ? (
                <span className="tts-spinner">⏳</span>
              ) : ttsStatus === 'playing' ? (
                <span>⏹</span>
              ) : (
                <span>🔊</span>
              )}
            </button>
            {ttsStatus === 'error' && errorMessage && (
              <div className="message-tts-error" title={errorMessage}>
                ⚠️
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
