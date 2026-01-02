export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  tts?: {
    status: 'idle' | 'loading' | 'ready' | 'playing' | 'error'
    voice?: string
    audioUrl?: string
  }
}

export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

