/**
 * Unified logging system for performance tracking
 * Tracks timing, tokens, and status for both text and TTS requests
 */

export interface PerformanceLog {
  type: 'text' | 'tts'
  startTime: number
  endTime?: number
  duration?: number
  status: 'pending' | 'success' | 'error'
  tokens?: {
    prompt?: number
    completion?: number
    total?: number
  }
  audioSize?: number // bytes for TTS
  textLength?: number // characters
  error?: string
  metadata?: Record<string, any>
}

// Use globalThis to ensure persistence across Next.js serverless function invocations
const globalForLogs = globalThis as unknown as {
  performanceLogger?: PerformanceLogger
}

class PerformanceLogger {
  private logs: Map<string, PerformanceLog> = new Map()
  private maxLogs: number = 100 // Keep last 100 logs

  /**
   * Get high-resolution time (works in both Node.js and browser)
   */
  private getHighResTime(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now()
    }
    // Fallback for Node.js
    const [seconds, nanoseconds] = process.hrtime()
    return seconds * 1000 + nanoseconds / 1000000
  }

  /**
   * Start a performance timer
   * @param type - 'text' or 'tts'
   * @param metadata - Additional metadata to log
   * @returns Timer ID for tracking
   */
  startTimer(type: 'text' | 'tts', metadata?: Record<string, any>): string {
    const timerId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const log: PerformanceLog = {
      type,
      startTime: this.getHighResTime(),
      status: 'pending',
      metadata,
    }
    this.logs.set(timerId, log)
    console.log(`[LOG] Started timer ${timerId}, total logs: ${this.logs.size}`)
    return timerId
  }

  /**
   * End a performance timer and log the results
   * @param timerId - Timer ID from startTimer
   * @param data - Performance data (tokens, audio size, etc.)
   */
  endTimer(
    timerId: string,
    data?: {
      status?: 'success' | 'error'
      tokens?: { prompt?: number; completion?: number; total?: number }
      audioSize?: number
      textLength?: number
      error?: string
      metadata?: Record<string, any>
    }
  ): PerformanceLog | null {
    const log = this.logs.get(timerId)
    if (!log) {
      console.warn(`Timer ${timerId} not found`)
      return null
    }

    log.endTime = this.getHighResTime()
    log.duration = log.endTime - log.startTime
    log.status = data?.status || 'success'
    
    if (data?.tokens) {
      log.tokens = data.tokens
    }
    
    if (data?.audioSize !== undefined) {
      log.audioSize = data.audioSize
    }
    
    if (data?.textLength !== undefined) {
      log.textLength = data.textLength
    }
    
    if (data?.error) {
      log.error = data.error
    }
    
    if (data?.metadata) {
      log.metadata = { ...log.metadata, ...data.metadata }
    }

    // Log to console with formatted output
    this.logToConsole(log)

    console.log(`[LOG] Ended timer ${timerId}, total logs: ${this.logs.size}`)

    // Keep only the most recent logs (prevent memory issues)
    if (this.logs.size > this.maxLogs) {
      const logsArray = Array.from(this.logs.entries())
      logsArray.sort((a, b) => (b[1].startTime || 0) - (a[1].startTime || 0))
      const toKeep = logsArray.slice(0, this.maxLogs)
      this.logs.clear()
      toKeep.forEach(([id, log]) => this.logs.set(id, log))
      console.log(`[LOG] Trimmed logs to ${this.maxLogs} entries`)
    }

    return log
  }

  /**
   * Log performance data to console
   */
  private logToConsole(log: PerformanceLog): void {
    const emoji = log.type === 'text' ? '📝' : '🔊'
    const statusEmoji = log.status === 'success' ? '✅' : '❌'
    
    console.log(`\n${emoji} ${statusEmoji} ${log.type.toUpperCase()} PERFORMANCE`)
    console.log('─'.repeat(50))
    console.log(`Duration: ${log.duration?.toFixed(2)}ms`)
    
    if (log.type === 'text' && log.tokens) {
      console.log(`Tokens:`)
      if (log.tokens.prompt) console.log(`  Prompt: ${log.tokens.prompt}`)
      if (log.tokens.completion) console.log(`  Completion: ${log.tokens.completion}`)
      if (log.tokens.total) console.log(`  Total: ${log.tokens.total}`)
    }
    
    if (log.type === 'tts') {
      if (log.audioSize) {
        console.log(`Audio Size: ${(log.audioSize / 1024).toFixed(2)} KB`)
      }
      if (log.textLength) {
        console.log(`Text Length: ${log.textLength} characters`)
      }
    }
    
    if (log.error) {
      console.log(`Error: ${log.error}`)
    }
    
    if (log.metadata && Object.keys(log.metadata).length > 0) {
      console.log(`Metadata:`, log.metadata)
    }
    
    console.log('─'.repeat(50))
  }

  /**
   * Get all logs (for debugging)
   */
  getLogs(): PerformanceLog[] {
    const logs = Array.from(this.logs.values())
    console.log(`[LOG] getLogs() called, returning ${logs.length} logs`)
    return logs
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.clear()
  }
}

// Export singleton instance - use global to persist across Next.js serverless invocations
export const performanceLogger =
  globalForLogs.performanceLogger ?? new PerformanceLogger()

if (process.env.NODE_ENV !== 'production') {
  globalForLogs.performanceLogger = performanceLogger
}

// Convenience functions
export const startTimer = (type: 'text' | 'tts', metadata?: Record<string, any>) => {
  return performanceLogger.startTimer(type, metadata)
}

export const endTimer = (
  timerId: string,
  data?: {
    status?: 'success' | 'error'
    tokens?: { prompt?: number; completion?: number; total?: number }
    audioSize?: number
    textLength?: number
    error?: string
    metadata?: Record<string, any>
  }
) => {
  return performanceLogger.endTimer(timerId, data)
}

