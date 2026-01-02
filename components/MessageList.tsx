'use client'

import { useRef, useEffect, useState } from 'react'
import type { Message } from '@/lib/types'
import MessageItem from './MessageItem'

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)

  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, shouldAutoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100
    setShouldAutoScroll(isNearBottom)
  }

  const handlePlayingChange = (messageId: string, playing: boolean) => {
    if (playing) {
      setPlayingMessageId(messageId)
    } else if (playingMessageId === messageId) {
      setPlayingMessageId(null)
    }
  }

  return (
    <div className="message-list" onScroll={handleScroll}>
      {messages.map((message) => (
        <MessageItem 
          key={message.id} 
          message={message}
          onPlayingChange={handlePlayingChange}
          isCurrentlyPlaying={playingMessageId === message.id}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

