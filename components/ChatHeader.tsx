'use client'

import { DEFAULT_VOICE, GROQ_TTS_VOICES, VOICE_NAMES, type GroqTTSVoice } from '@/config/tts'

interface ChatHeaderProps {
  title: string
  selectedVoice: GroqTTSVoice
  onVoiceChange: (voice: GroqTTSVoice) => void
  onShowLogs: () => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function ChatHeader({
  title,
  selectedVoice,
  onVoiceChange,
  onShowLogs,
  onToggleSidebar,
  sidebarOpen,
}: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <button
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span>☰</span>
        </button>
        <h1 className="chat-title">{title}</h1>
      </div>
      <div className="chat-header-right">
        <select
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value as GroqTTSVoice)}
          className="voice-select"
        >
          {Object.entries(VOICE_NAMES).map(([value, name]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
        <button
          onClick={onShowLogs}
          className="logs-button"
          aria-label="View performance logs"
          title="View performance logs"
        >
          📊
        </button>
      </div>
    </header>
  )
}

