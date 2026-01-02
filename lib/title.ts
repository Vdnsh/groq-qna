/**
 * Generate a chat title from the first user message
 */
export function generateChatTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(/\s+/).slice(0, 7)
  return words.join(' ') || 'New Chat'
}

