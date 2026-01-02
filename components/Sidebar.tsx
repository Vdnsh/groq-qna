'use client'

import { useState } from 'react'
import type { Chat } from '@/lib/types'
import { deleteChat, renameChat } from '@/lib/storage'

interface SidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleRename = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId)
    setEditTitle(currentTitle)
    setMenuOpenId(null)
  }

  const handleRenameSubmit = (chatId: string) => {
    if (editTitle.trim()) {
      renameChat(chatId, editTitle.trim())
    }
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleDelete = (chatId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChat(chatId)
      setMenuOpenId(null)
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <button className="sidebar-new-chat" onClick={onNewChat}>
          <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>New chat</span>
        </button>

        <div className="sidebar-search">
          <svg className="sidebar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar-search-input"
          />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">Your chats</div>
          {filteredChats.length === 0 ? (
            <div className="sidebar-empty">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`sidebar-item sidebar-chat ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRenameSubmit(chat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(chat.id)
                      if (e.key === 'Escape') {
                        setEditingChatId(null)
                        setEditTitle('')
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="sidebar-edit-input"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="sidebar-chat-title">{chat.title}</span>
                    <button
                      className="sidebar-chat-menu"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === chat.id ? null : chat.id)
                      }}
                    >
                      ⋮
                    </button>
                    {menuOpenId === chat.id && (
                      <div className="sidebar-menu" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleRename(chat.id, chat.title)}>Rename</button>
                        <button onClick={() => handleDelete(chat.id)} className="danger">Delete</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">V</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Vedansh Jain</div>
            <div className="sidebar-user-badge">Plus</div>
          </div>
        </div>
      </div>
    </div>
  )
}

