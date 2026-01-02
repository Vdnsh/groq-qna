import type { Chat, Message } from './types'
import { generateId } from './ids'
import { generateChatTitle } from './title'

const STORAGE_KEY = 'groq.chat.v1'
const ACTIVE_ID_KEY = 'groq.chat.activeId.v1'
const VOICE_KEY = 'app.tts.voice.v1'

/**
 * Get all chats from localStorage
 */
export function getAllChats(): Chat[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as Chat[]
  } catch (error) {
    console.error('Error reading chats from localStorage:', error)
    return []
  }
}

/**
 * Save all chats to localStorage
 */
export function saveAllChats(chats: Chat[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  } catch (error) {
    console.error('Error saving chats to localStorage:', error)
  }
}

/**
 * Get a chat by ID
 */
export function getChatById(chatId: string): Chat | null {
  const chats = getAllChats()
  return chats.find(chat => chat.id === chatId) || null
}

/**
 * Create a new chat
 */
export function createChat(): Chat {
  const chat: Chat = {
    id: generateId(),
    title: 'New Chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  }
  
  const chats = getAllChats()
  chats.unshift(chat)
  saveAllChats(chats)
  setActiveChatId(chat.id)
  
  return chat
}

/**
 * Update a chat
 */
export function updateChat(chatId: string, updater: (chat: Chat) => Chat): Chat | null {
  const chats = getAllChats()
  const index = chats.findIndex(chat => chat.id === chatId)
  
  if (index === -1) return null
  
  chats[index] = updater(chats[index])
  chats[index].updatedAt = Date.now()
  saveAllChats(chats)
  
  return chats[index]
}

/**
 * Add a message to a chat
 */
export function addMessage(chatId: string, message: Omit<Message, 'id' | 'createdAt'>): Message | null {
  const fullMessage: Message = {
    ...message,
    id: generateId(),
    createdAt: Date.now(),
  }
  
  const chat = updateChat(chatId, (chat) => {
    const updated = {
      ...chat,
      messages: [...chat.messages, fullMessage],
    }
    
    // Auto-generate title from first user message
    if (fullMessage.role === 'user' && chat.title === 'New Chat') {
      updated.title = generateChatTitle(fullMessage.content)
    }
    
    return updated
  })
  
  return fullMessage
}

/**
 * Delete a chat
 */
export function deleteChat(chatId: string): boolean {
  const chats = getAllChats()
  const filtered = chats.filter(chat => chat.id !== chatId)
  
  if (filtered.length === chats.length) return false
  
  saveAllChats(filtered)
  
  // Clear active if it was this chat
  if (getActiveChatId() === chatId) {
    clearActiveChatId()
    if (filtered.length > 0) {
      setActiveChatId(filtered[0].id)
    }
  }
  
  return true
}

/**
 * Rename a chat
 */
export function renameChat(chatId: string, newTitle: string): boolean {
  const chat = updateChat(chatId, (chat) => ({
    ...chat,
    title: newTitle.trim() || 'New Chat',
  }))
  
  return chat !== null
}

/**
 * Get active chat ID
 */
export function getActiveChatId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_ID_KEY)
}

/**
 * Set active chat ID
 */
export function setActiveChatId(chatId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_ID_KEY, chatId)
}

/**
 * Clear active chat ID
 */
export function clearActiveChatId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACTIVE_ID_KEY)
}

/**
 * Get selected voice
 */
export function getSelectedVoice(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(VOICE_KEY)
}

/**
 * Set selected voice
 */
export function setSelectedVoice(voice: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(VOICE_KEY, voice)
}

