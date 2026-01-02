export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  tts?: {
    voice: string
    audioUrl?: string
    status: 'idle' | 'loading' | 'ready' | 'error'
  }
}

export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

