import type { Chat, Message } from './chatTypes'

const STORAGE_KEY = 'groq.chat.v1'
const LAST_ACTIVE_KEY = 'groq.lastActiveChatId'

/**
 * Generate a unique ID for chats and messages
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

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
 * Get a specific chat by ID
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
  chats.unshift(chat) // Add to beginning
  saveAllChats(chats)
  
  return chat
}

/**
 * Update a chat (add message, update title, etc.)
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
  
  const chat = updateChat(chatId, (chat) => ({
    ...chat,
    messages: [...chat.messages, fullMessage],
  }))
  
  // Auto-generate title from first user message
  if (fullMessage.role === 'user' && chat && chat.title === 'New Chat') {
    const titleWords = fullMessage.content.trim().split(/\s+/).slice(0, 7).join(' ')
    updateChat(chatId, (chat) => ({
      ...chat,
      title: titleWords || 'New Chat',
    }))
  }
  
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
  
  // Clear last active if it was this chat
  if (getLastActiveChatId() === chatId) {
    clearLastActiveChatId()
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
 * Get the last active chat ID
 */
export function getLastActiveChatId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LAST_ACTIVE_KEY)
}

/**
 * Set the last active chat ID
 */
export function setLastActiveChatId(chatId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_ACTIVE_KEY, chatId)
}

/**
 * Clear the last active chat ID
 */
export function clearLastActiveChatId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LAST_ACTIVE_KEY)
}

