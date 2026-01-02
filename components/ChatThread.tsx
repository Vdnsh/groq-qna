'use client'

import { useState } from 'react'
import type { Chat } from '@/lib/types'
import { addMessage, getChatById } from '@/lib/storage'
import { askGroq } from '@/lib/api'
import { synthesizeTTS } from '@/lib/tts'
import { playFromUrl, stop } from '@/lib/ttsPlayer'
import { getSelectedVoice } from '@/lib/storage'
import { DEFAULT_VOICE } from '@/config/tts'
import MessageList from './MessageList'
import Composer from './Composer'

interface ChatThreadProps {
  chat: Chat
  onUpdate: () => void
}

export default function ChatThread({ chat, onUpdate }: ChatThreadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReadingLast, setIsReadingLast] = useState(false)

  const handleSend = async (content: string) => {
    if (!chat || !content.trim()) return

    setLoading(true)
    setError(null)

    // Add user message
    addMessage(chat.id, {
      role: 'user',
      content,
    })
    onUpdate()

    try {
      // Get updated chat with new message
      const updatedChat = getChatById(chat.id)
      if (!updatedChat) {
        throw new Error('Chat not found')
      }

      // Prepare messages for API (last 20 messages to control size)
      const recentMessages = updatedChat.messages.slice(-20)
      const apiMessages = recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      // Call API
      const response = await askGroq({ messages: apiMessages })

      // Add assistant message
      addMessage(chat.id, {
        role: 'assistant',
        content: response.answer,
      })
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-thread">
      <div className="chat-messages">
        <MessageList messages={chat.messages} />
        {loading && (
          <div className="message-item message-assistant">
            <div className="message-content">
              <div className="message-text">Thinking...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="chat-error">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      <div className="chat-composer-wrapper">
        <div className="composer-container">
          {chat.messages.length > 0 && (() => {
            const lastAssistantMessage = [...chat.messages].reverse().find(m => m.role === 'assistant')
            return lastAssistantMessage ? (
              <button
                className="composer-read-last"
                onClick={async () => {
                  if (isReadingLast) {
                    stop()
                    setIsReadingLast(false)
                    return
                  }
                  setIsReadingLast(true)
                  try {
                    const voice = getSelectedVoice() || DEFAULT_VOICE
                    stop()
                    const audioUrl = await synthesizeTTS(lastAssistantMessage.content, voice)
                    await playFromUrl(audioUrl)
                  } catch (error) {
                    console.error('TTS error:', error)
                  } finally {
                setIsReadingLast(false)
                  }
                }}
                title={isReadingLast ? 'Stop reading' : 'Read last assistant message'}
                aria-label={isReadingLast ? 'Stop reading' : 'Read last assistant message'}
              >
                {isReadingLast ? '⏹' : '🔊'}
              </button>
            ) : null
          })()}
          <Composer onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </div>
  )
}

