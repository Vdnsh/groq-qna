'use client'

import { useState } from 'react'
import Composer from './Composer'
import { createChat, addMessage } from '@/lib/storage'
import { askGroq } from '@/lib/api'

interface HomeEmptyStateProps {
  onSendMessage: (chatId: string) => void
}

export default function HomeEmptyState({ onSendMessage }: HomeEmptyStateProps) {
  const [loading, setLoading] = useState(false)

  const handleSend = async (content: string) => {
    if (!content.trim() || loading) return

    setLoading(true)

    try {
      // Create new chat
      const newChat = createChat()
      
      // Add user message
      addMessage(newChat.id, {
        role: 'user',
        content,
      })

      // Call API
      const response = await askGroq({ messages: [{ role: 'user', content }] })

      // Add assistant message
      addMessage(newChat.id, {
        role: 'assistant',
        content: response.answer,
      })

      // Switch to this chat
      onSendMessage(newChat.id)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-empty-state">
      <div className="home-empty-content">
        <h1 className="home-empty-title">What&apos;s on your mind today?</h1>
        <div className="home-empty-composer-wrapper">
          <Composer onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </div>
  )
}

