'use client'

import { useState, useEffect } from 'react'

interface PerformanceLog {
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
  audioSize?: number
  textLength?: number
  error?: string
  metadata?: Record<string, any>
}

interface PerformanceModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PerformanceModal({ isOpen, onClose }: PerformanceModalProps) {
  const [logs, setLogs] = useState<PerformanceLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const response = await fetch('/api/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
      const interval = setInterval(fetchLogs, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const clearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' })
      setLogs([])
    } catch (err) {
      console.error('Failed to clear logs:', err)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h2>Performance Logs</h2>
          <div className="modal-actions">
            <button onClick={clearLogs} className="btn-danger">Clear</button>
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        </div>
        <div className="modal-body">
          {loadingLogs ? (
            <div className="modal-empty">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="modal-empty">No logs yet. Make some requests to see performance data.</div>
          ) : (
            <div className="logs-list">
              {logs.map((log, index) => (
                <div key={index} className={`log-item ${log.status === 'error' ? 'log-error' : ''}`}>
                  <div className="log-header">
                    <span className="log-icon">{log.type === 'text' ? '📝' : '🔊'}</span>
                    <span className="log-type">{log.type}</span>
                    <span className={`log-status ${log.status === 'success' ? 'log-success' : 'log-error-text'}`}>
                      {log.status === 'success' ? '✅ Success' : '❌ Error'}
                    </span>
                    {log.duration && (
                      <span className="log-duration">{log.duration.toFixed(2)}ms</span>
                    )}
                  </div>
                  {log.type === 'text' && log.tokens && (
                    <div className="log-details">
                      {log.tokens.prompt && <span>Prompt: <strong>{log.tokens.prompt}</strong></span>}
                      {log.tokens.completion && <span>Completion: <strong>{log.tokens.completion}</strong></span>}
                      {log.tokens.total && <span>Total: <strong>{log.tokens.total}</strong></span>}
                    </div>
                  )}
                  {log.type === 'tts' && (
                    <div className="log-details">
                      {log.audioSize && <span>Size: <strong>{(log.audioSize / 1024).toFixed(2)} KB</strong></span>}
                      {log.textLength && <span>Text: <strong>{log.textLength}</strong> chars</span>}
                      {log.metadata?.voice && <span>Voice: <strong>{log.metadata.voice}</strong></span>}
                    </div>
                  )}
                  {log.error && <div className="log-error-message">{log.error}</div>}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="log-metadata">
                      <summary>Metadata</summary>
                      <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

