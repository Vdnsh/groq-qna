'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import HomeEmptyState from './HomeEmptyState'
import ChatThread from './ChatThread'
import type { Chat } from '@/lib/types'
import { getAllChats, getChatById, createChat, getActiveChatId, setActiveChatId } from '@/lib/storage'

export default function AppShell() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<Chat | null>(null)

  // Load chats on mount
  useEffect(() => {
    const savedChats = getAllChats()
    setChats(savedChats)

    const lastActiveId = getActiveChatId()
    if (lastActiveId && savedChats.find(c => c.id === lastActiveId)) {
      setActiveChatIdState(lastActiveId)
      setActiveChat(getChatById(lastActiveId))
    } else if (savedChats.length > 0) {
      setActiveChatIdState(savedChats[0].id)
      setActiveChat(savedChats[0])
      setActiveChatId(savedChats[0].id)
    }
  }, [])

  // Update active chat when ID changes
  useEffect(() => {
    if (activeChatId) {
      const chat = getChatById(activeChatId)
      setActiveChat(chat)
      setActiveChatId(activeChatId)
    } else {
      setActiveChat(null)
    }
  }, [activeChatId])

  // Refresh chats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedChats = getAllChats()
      if (updatedChats.length !== chats.length) {
        setChats(updatedChats)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [chats.length])

  const handleNewChat = () => {
    const newChat = createChat()
    const updatedChats = getAllChats()
    setChats(updatedChats)
    setActiveChatIdState(newChat.id)
    setActiveChat(newChat)
  }

  const handleSelectChat = (chatId: string) => {
    setActiveChatIdState(chatId)
  }

  const handleChatUpdate = () => {
    const updatedChats = getAllChats()
    setChats(updatedChats)
    if (activeChatId) {
      const updatedChat = getChatById(activeChatId)
      setActiveChat(updatedChat)
    }
  }

  const handleChatCreated = (chatId: string) => {
    const updatedChats = getAllChats()
    setChats(updatedChats)
    setActiveChatIdState(chatId)
    setActiveChat(getChatById(chatId))
  }

  return (
    <div className="app-shell">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <div className="app-main">
        <TopBar />
        {activeChat && activeChat.messages.length > 0 ? (
          <ChatThread chat={activeChat} onUpdate={handleChatUpdate} />
        ) : (
          <HomeEmptyState onSendMessage={handleChatCreated} />
        )}
      </div>
    </div>
  )
}

