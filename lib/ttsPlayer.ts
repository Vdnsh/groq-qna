/**
 * Singleton TTS audio player controller
 * Ensures only one audio plays at a time
 */

let globalAudioInstance: HTMLAudioElement | null = null
let currentAudioUrl: string | null = null
let onEndedCallbacks: Set<() => void> = new Set()
let onErrorCallbacks: Set<(error: Error) => void> = new Set()

/**
 * Stop any currently playing audio
 */
export function stop(): void {
  if (globalAudioInstance) {
    globalAudioInstance.pause()
    globalAudioInstance.currentTime = 0
    globalAudioInstance = null
  }
  
  if (currentAudioUrl) {
    try {
      URL.revokeObjectURL(currentAudioUrl)
    } catch (e) {
      // Ignore errors when revoking URL
    }
    currentAudioUrl = null
  }
  
  // Clear callbacks
  onEndedCallbacks.clear()
  onErrorCallbacks.clear()
}

/**
 * Check if audio is currently playing
 */
export function isPlaying(): boolean {
  return globalAudioInstance !== null && !globalAudioInstance.paused
}

/**
 * Play audio from a blob URL
 */
export async function playFromUrl(audioUrl: string): Promise<void> {
  // Stop any current audio
  stop()
  
  // Create new audio instance
  const audio = new Audio(audioUrl)
  globalAudioInstance = audio
  currentAudioUrl = audioUrl
  
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (currentAudioUrl === audioUrl) {
        URL.revokeObjectURL(audioUrl)
        currentAudioUrl = null
      }
      globalAudioInstance = null
      onEndedCallbacks.clear()
      onErrorCallbacks.clear()
    }
    
    audio.onended = () => {
      const callbacks = Array.from(onEndedCallbacks)
      cleanup()
      callbacks.forEach(cb => cb())
      resolve()
    }
    
    audio.onerror = () => {
      const error = new Error('Audio playback failed')
      const callbacks = Array.from(onErrorCallbacks)
      cleanup()
      callbacks.forEach(cb => cb(error))
      reject(error)
    }
    
    audio.play().catch((error) => {
      const callbacks = Array.from(onErrorCallbacks)
      cleanup()
      callbacks.forEach(cb => cb(error))
      reject(error)
    })
  })
}

/**
 * Add callback for when audio ends
 */
export function onEnded(callback: () => void): () => void {
  onEndedCallbacks.add(callback)
  // Return unsubscribe function
  return () => {
    onEndedCallbacks.delete(callback)
  }
}

/**
 * Add callback for when audio errors
 */
export function onError(callback: (error: Error) => void): () => void {
  onErrorCallbacks.add(callback)
  // Return unsubscribe function
  return () => {
    onErrorCallbacks.delete(callback)
  }
}
