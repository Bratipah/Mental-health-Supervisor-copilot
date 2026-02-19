'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface RiskDetail {
  type: string
  severity: string
  quote: string
  context: string
  recommendedAction: string
}

interface AIAnalysis {
  summary: string
  conceptAdherence: { score: number; conceptTaught: boolean; conceptName: string; evidence: string; justification: string }
  participantEngagement: { score: number; justification: string; evidence: string }
  safetyProtocol: { score: number; justification: string; evidence: string }
  therapeuticAlliance: { score: number; justification: string; evidence: string }
  riskFlag: 'SAFE' | 'RISK'
  riskDetails?: RiskDetail[]
  overallQualityScore: number
  confidenceScore: number
  keyStrengths: string[]
  areasForImprovement: string[]
}

interface Session {
  id: string
  fellowName: string
  groupId: string
  sessionDate: string
  durationMinutes: number
  assignedConcept: string
  status: string
  transcript: string
  aiAnalysis: AIAnalysis | null
  aiConfidenceScore: number | null
  aiProcessedAt: string | null
  supervisorAction: string | null
  supervisorNote: string | null
  supervisorReviewedAt: string | null
}

interface Props {
  sessionId: string
}

export default function SessionDetail({ sessionId }: Props) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [validating, setValidating] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [activeTab, setActiveTab] = useState<'analysis' | 'transcript'>('analysis')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  async function fetchSession() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`)
      const data = await res.json()
      setSession(data)
      if (data.supervisorNote) setReviewNote(data.supervisorNote)
    } catch (err) {
      setErrorMsg('Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/analysis/${sessionId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchSession()
    } catch (err) {
      setErrorMsg((err as Error).message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleValidate(action: string) {
    setValidating(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/validate/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: reviewNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccessMsg(data.message)
      await fetchSession()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorMsg((err as Error).message || 'Action failed')
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-gray-500 text-sm">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Session not found</p>
        <Link href="/dashboard" className="text-blue-600 text-sm mt-2 inline-block hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  const isRisk = session.status === 'risk' || session.aiAnalysis?.riskFlag === 'RISK'
  const hasAnalysis = !!session.aiAnalysis
  const confidencePct = session.aiConfidenceScore ? Math.round(session.aiConfidenceScore * 100) : null
  const isReviewed = !!session.supervisorAction

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back + Header */}
      <div className="mb-5">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Analysis</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {session.fellowName} · {format(new Date(session.sessionDate), 'MMMM d, yyyy')} · {session.durationMinutes} minutes
            </p>
          </div>

          {/* Risk Banner */}
          {isRisk && (
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl risk-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-bold text-sm">⚠️ RISK DETECTED</span>
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        {/* Left Column - Session Info + Actions */}
        <div className="col-span-4 space-y-4">
          {/* Session Metadata */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Session Details</h3>
            <div className="space-y-3">
              {[
                { label: 'Fellow', value: session.fellowName },
                { label: 'Group ID', value: session.groupId, mono: true },
                { label: 'Concept', value: session.assignedConcept },
                { label: 'Duration', value: `${session.durationMinutes} minutes` },
                { label: 'Date', value: format(new Date(session.sessionDate), 'MMM d, yyyy') },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={`text-xs font-medium text-gray-800 text-right max-w-[150px] ${item.mono ? 'font-mono bg-gray-100 px-1.5 py-0.5 rounded' : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">AI Analysis</h3>
            
            {!hasAnalysis ? (
              <div className="text-center py-3">
                <p className="text-xs text-gray-500 mb-3">No analysis yet</p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full py-2.5 px-4 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {analyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Analyzing...
                    </span>
                  ) : '🤖 Run AI Analysis'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Risk Flag</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    session.aiAnalysis?.riskFlag === 'RISK' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {session.aiAnalysis?.riskFlag}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">AI Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (session.aiConfidenceScore || 0) >= 0.75 ? 'bg-green-500' :
                          (session.aiConfidenceScore || 0) >= 0.55 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(session.aiConfidenceScore || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{confidencePct}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Quality Score</span>
                  <span className="text-xs font-bold text-gray-800">{session.aiAnalysis?.overallQualityScore.toFixed(1)}/10</span>
                </div>
                {session.aiProcessedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Analyzed</span>
                    <span className="text-xs text-gray-600">{format(new Date(session.aiProcessedAt), 'MMM d, HH:mm')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Supervisor Review Panel */}
          {hasAnalysis && (
            <div className={`bg-white rounded-xl border-2 p-5 ${isRisk ? 'border-red-400' : 'border-gray-200'}`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Supervisor Review</h3>
              <p className="text-xs text-gray-500 mb-4">Your review overrides AI findings</p>

              {isReviewed && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-medium text-green-700">
                    ✓ Reviewed: {session.supervisorAction?.replace(/_/g, ' ')}
                  </p>
                  {session.supervisorNote && (
                    <p className="text-xs text-green-600 mt-1">"{session.supervisorNote}"</p>
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Supervisor Note
                </label>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Add your observations or explain your decision..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleValidate('validated')}
                  disabled={validating}
                  className="w-full py-2 px-3 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  ✓ Confirm AI Assessment
                </button>
                
                {!isRisk && (
                  <button
                    onClick={() => handleValidate('overridden_risk')}
                    disabled={validating}
                    className="w-full py-2 px-3 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    ⚠️ Override → Flag as RISK
                  </button>
                )}
                
                {isRisk && (
                  <button
                    onClick={() => handleValidate('overridden_safe')}
                    disabled={validating}
                    className="w-full py-2 px-3 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                  >
                    Override → Mark as SAFE
                  </button>
                )}

                <button
                  onClick={() => handleValidate('rejected')}
                  disabled={validating}
                  className="w-full py-2 px-3 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                >
                  ✗ Flag for Further Review
                </button>
              </div>
              
              <p className="text-xs text-gray-400 mt-3 text-center">
                AI Policy: Human review required for all RISK flags
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Analysis */}
        <div className="col-span-8 space-y-4">
          {/* Tabs */}
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            {['analysis', 'transcript'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'analysis' ? '🤖 AI Analysis' : '📝 Transcript'}
              </button>
            ))}
          </div>

          {activeTab === 'transcript' ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Session Transcript</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {session.transcript}
                </pre>
              </div>
            </div>
          ) : !hasAnalysis ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready for AI Analysis</h3>
              <p className="text-gray-500 text-sm mb-5">
                Click "Run AI Analysis" to generate an evidence-based assessment of this session.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white font-medium rounded-xl hover:bg-blue-800 transition disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analyzing session...
                  </>
                ) : (
                  <>🤖 Run AI Analysis</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* RISK ALERT - Most prominent */}
              {isRisk && session.aiAnalysis?.riskDetails && session.aiAnalysis.riskDetails.length > 0 && (
                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-red-800">⚠️ RISK DETECTED — Immediate Review Required</h3>
                      <p className="text-red-600 text-sm">AI has identified content requiring urgent supervisor attention</p>
                    </div>
                  </div>

                  {session.aiAnalysis.riskDetails.map((detail, i) => (
                    <div key={i} className="bg-white border border-red-200 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-700 uppercase">{detail.type.replace(/_/g, ' ')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          detail.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          detail.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {detail.severity.toUpperCase()}
                        </span>
                      </div>
                      <blockquote className="border-l-4 border-red-400 pl-3 mb-3">
                        <p className="text-sm text-gray-800 italic">"{detail.quote}"</p>
                      </blockquote>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <p><span className="font-semibold">Context:</span> {detail.context}</p>
                        <p className="text-red-700 font-medium"><span className="font-semibold">Action Required:</span> {detail.recommendedAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Session Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Session Summary
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{session.aiAnalysis?.summary}</p>
              </div>

              {/* Scores Grid */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Quantitative Scores
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Concept Adherence', key: 'conceptAdherence', score: session.aiAnalysis?.conceptAdherence.score || 0, justification: session.aiAnalysis?.conceptAdherence.justification, evidence: session.aiAnalysis?.conceptAdherence.evidence },
                    { label: 'Participant Engagement', key: 'participantEngagement', score: session.aiAnalysis?.participantEngagement.score || 0, justification: session.aiAnalysis?.participantEngagement.justification, evidence: session.aiAnalysis?.participantEngagement.evidence },
                    { label: 'Safety Protocol', key: 'safetyProtocol', score: session.aiAnalysis?.safetyProtocol.score || 0, justification: session.aiAnalysis?.safetyProtocol.justification, evidence: session.aiAnalysis?.safetyProtocol.evidence },
                    { label: 'Therapeutic Alliance', key: 'therapeuticAlliance', score: session.aiAnalysis?.therapeuticAlliance.score || 0, justification: session.aiAnalysis?.therapeuticAlliance.justification, evidence: session.aiAnalysis?.therapeuticAlliance.evidence },
                  ].map(metric => (
                    <div key={metric.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-700">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            metric.score >= 7 ? 'text-green-600' :
                            metric.score >= 5 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {metric.score.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400">/10</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            metric.score >= 7 ? 'bg-green-500' :
                            metric.score >= 5 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${metric.score * 10}%` }}
                        />
                      </div>
                      {metric.justification && (
                        <p className="text-xs text-gray-500 mt-1">{metric.justification}</p>
                      )}
                      {metric.evidence && (
                        <p className="text-xs text-blue-600 italic mt-0.5">Evidence: {metric.evidence}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-green-800 mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    {session.aiAnalysis?.keyStrengths?.map((strength, i) => (
                      <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {session.aiAnalysis?.areasForImprovement?.map((area, i) => (
                      <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Confidence Disclosure */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">AI Confidence Level</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(session.aiConfidenceScore || 0) >= 0.75
                        ? 'High confidence — analysis is reliable'
                        : (session.aiConfidenceScore || 0) >= 0.55
                          ? 'Medium confidence — review carefully'
                          : 'Low confidence — human review strongly recommended'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${
                      (session.aiConfidenceScore || 0) >= 0.75 ? 'text-green-600' :
                      (session.aiConfidenceScore || 0) >= 0.55 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {confidencePct}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (session.aiConfidenceScore || 0) >= 0.75 ? 'bg-green-500' :
                      (session.aiConfidenceScore || 0) >= 0.55 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(session.aiConfidenceScore || 0) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  🔒 AI Policy: This analysis requires human validation. Your decision overrides AI findings.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
