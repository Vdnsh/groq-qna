import { NextResponse } from 'next/server'
import { performanceLogger } from '@/lib/log'

export async function GET() {
  try {
    console.log('[API] /api/logs GET called')
    const logs = performanceLogger.getLogs()
    console.log(`[API] Found ${logs.length} logs`)
    
    // Return logs sorted by start time (newest first)
    const sortedLogs = logs.sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
    
    return NextResponse.json({
      logs: sortedLogs,
      count: sortedLogs.length,
    })
  } catch (error) {
    console.error('[API] Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    performanceLogger.clearLogs()
    return NextResponse.json({ success: true, message: 'Logs cleared' })
  } catch (error) {
    console.error('Error clearing logs:', error)
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    )
  }
}

