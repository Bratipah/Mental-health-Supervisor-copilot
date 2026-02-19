'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'

interface SessionListItem {
  id: string
  fellowName: string
  fellowId: string
  groupId: string
  sessionDate: string
  durationMinutes: number
  assignedConcept: string
  status: string
  aiConfidenceScore: number | null
  supervisorAction: string | null
  aiProcessedAt: string | null
}

interface Stats {
  total: number
  risk: number
  flagged: number
  pending: number
  safe: number
  processed: number
}

interface BatchStatus {
  batchId: string
  processed: number
  total: number
  status: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  risk: { label: 'RISK', className: 'risk-badge risk-pulse', dot: 'bg-red-500' },
  flagged_for_review: { label: 'Needs Review', className: 'review-badge', dot: 'bg-amber-500' },
  safe: { label: 'Safe', className: 'safe-badge', dot: 'bg-green-500' },
  processed: { label: 'Processed', className: 'processing-badge', dot: 'bg-blue-500' },
  processing: { label: 'Processing...', className: 'processing-badge', dot: 'bg-blue-400' },
  pending: { label: 'Pending', className: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' },
}

export default function SessionsDashboard() {
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [batchPolling, setBatchPolling] = useState(false)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions?page=${page}&status=${statusFilter}`)
      const data = await res.json()
      setSessions(data.sessions || [])
      setStats(data.stats || null)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Poll batch status
  useEffect(() => {
    if (!batchPolling || !batchStatus?.batchId) return
    
    const interval = setInterval(async () => {
      const res = await fetch(`/api/batch?batchId=${batchStatus.batchId}`)
      const data = await res.json()
      setBatchStatus(prev => prev ? { ...prev, ...data } : null)
      
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'partial') {
        setBatchPolling(false)
        fetchSessions()
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [batchPolling, batchStatus?.batchId, fetchSessions])

  async function handleBatchAnalyze() {
    const pendingIds = sessions
      .filter(s => s.status === 'pending')
      .map(s => s.id)
    
    if (pendingIds.length === 0) {
      alert('No pending sessions to analyze')
      return
    }

    const res = await fetch('/api/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds: pendingIds }),
    })
    
    const data = await res.json()
    setBatchStatus({ batchId: data.batchId, processed: 0, total: data.sessionCount, status: 'processing' })
    setBatchPolling(true)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pendingCount = stats?.pending || 0
  const riskCount = stats?.risk || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Session Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor and review therapy sessions by your Fellows</p>
      </div>

      {/* Risk Alert Banner */}
      {riskCount > 0 && (
        <div className="mb-5 p-4 bg-red-50 border-2 border-red-400 rounded-xl flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center risk-pulse">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-red-800 font-bold">⚠️ {riskCount} session{riskCount > 1 ? 's' : ''} flagged as RISK</p>
            <p className="text-red-700 text-sm">Immediate supervisor review required. Click on flagged sessions below.</p>
          </div>
          <button
            onClick={() => setStatusFilter('risk')}
            className="flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
          >
            View Risk Sessions
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-white' },
            { label: 'RISK', value: stats.risk, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
            { label: 'Needs Review', value: stats.flagged, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
            { label: 'Safe', value: stats.safe, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
            { label: 'Pending', value: stats.pending, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} border rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {['all', 'risk', 'flagged_for_review', 'pending', 'safe', 'processed'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'all' ? 'All' : s === 'flagged_for_review' ? 'Review' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch Analyze */}
          {pendingCount > 0 && !batchPolling && (
            <button
              onClick={handleBatchAnalyze}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
              Analyze All Pending ({pendingCount})
            </button>
          )}
          
          {/* Refresh */}
          <button
            onClick={fetchSessions}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Batch Progress */}
      {batchStatus && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-800">
              {batchStatus.status === 'completed' ? '✅ Batch Analysis Complete' : '🔄 Analyzing sessions with AI...'}
            </p>
            <span className="text-xs text-blue-600">{batchStatus.processed}/{batchStatus.total}</span>
          </div>
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(batchStatus.processed / batchStatus.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">
            Completed Sessions
            {loading && <span className="ml-2 text-gray-400 text-xs font-normal">Loading...</span>}
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Loading sessions...
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            No sessions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fellow</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Group</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Concept</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">AI Confidence</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map(session => {
                  const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending
                  const isRisk = session.status === 'risk'
                  
                  return (
                    <tr
                      key={session.id}
                      className={`hover:bg-gray-50 transition-colors ${isRisk ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                            {session.fellowName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{session.fellowName}</p>
                            <p className="text-xs text-gray-400">Fellow</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{format(new Date(session.sessionDate), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-gray-400">{session.durationMinutes} min</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {session.groupId}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700 max-w-[140px] truncate">{session.assignedConcept}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={statusCfg.className}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {session.aiConfidenceScore != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  session.aiConfidenceScore >= 0.75 ? 'bg-green-500' :
                                  session.aiConfidenceScore >= 0.55 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${session.aiConfidenceScore * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(session.aiConfidenceScore * 100)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/session/${session.id}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isRisk
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isRisk ? '⚠️ Review Now' : 'View Analysis'}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
