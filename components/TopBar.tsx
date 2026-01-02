'use client'

import { useState, useEffect, useRef } from 'react'
import PerformanceModal from './PerformanceModal'
import { DEFAULT_VOICE, GROQ_TTS_VOICES, VOICE_NAMES, type GroqTTSVoice } from '@/config/tts'
import { getSelectedVoice, setSelectedVoice as saveSelectedVoice } from '@/lib/storage'

export default function TopBar() {
  const [showLogs, setShowLogs] = useState(false)
  const [showVoiceMenu, setShowVoiceMenu] = useState(false)
  const voiceMenuRef = useRef<HTMLDivElement>(null)
  const [selectedVoice, setSelectedVoice] = useState<GroqTTSVoice>(() => {
    if (typeof window !== 'undefined') {
      const saved = getSelectedVoice() as GroqTTSVoice
      return saved && Object.values(GROQ_TTS_VOICES).includes(saved) ? saved : DEFAULT_VOICE
    }
    return DEFAULT_VOICE
  })

  // Close voice menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(event.target as Node)) {
        setShowVoiceMenu(false)
      }
    }

    if (showVoiceMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showVoiceMenu])

  const handleVoiceChange = (voice: GroqTTSVoice) => {
    setSelectedVoice(voice)
    saveSelectedVoice(voice)
    setShowVoiceMenu(false)
  }

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-left">
          <span className="top-bar-title">ChatGPT 5.2</span>
          <span className="top-bar-chevron">▼</span>
        </div>
        <div className="top-bar-right">
          <div className="top-bar-voice-menu" ref={voiceMenuRef}>
            <button
              className="top-bar-icon"
              onClick={() => setShowVoiceMenu(!showVoiceMenu)}
              aria-label="Voice settings"
              title="Voice settings"
            >
              🔊
            </button>
            {showVoiceMenu && (
              <div className="voice-menu-dropdown">
                <div className="voice-menu-header">Select Voice</div>
                {Object.entries(VOICE_NAMES).map(([value, name]) => (
                  <button
                    key={value}
                    className={`voice-menu-item ${selectedVoice === value ? 'active' : ''}`}
                    onClick={() => handleVoiceChange(value as GroqTTSVoice)}
                  >
                    {name}
                    {selectedVoice === value && ' ✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="top-bar-icon"
            onClick={() => setShowLogs(true)}
            aria-label="View performance logs"
            title="View performance logs"
          >
            📊
          </button>
          <button className="top-bar-icon" aria-label="Profile">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="6" r="3" />
              <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
            </svg>
          </button>
          <button className="top-bar-icon" aria-label="Settings">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="1.5" />
              <path d="M8 1v2M8 13v2M15 8h-2M3 8H1M13.5 2.5l-1.4 1.4M3.9 12.1l-1.4 1.4M13.5 13.5l-1.4-1.4M3.9 3.9l-1.4-1.4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        </div>
      </div>
      <PerformanceModal isOpen={showLogs} onClose={() => setShowLogs(false)} />
    </>
  )
}

