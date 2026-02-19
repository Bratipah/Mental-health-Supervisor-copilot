import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sessions, auditLog } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { analyzeSession, shouldFlagForHumanReview, generateMockAnalysis } from '@/lib/ai-engine'
import { cache } from '@/lib/cache'

function getAuth(request: NextRequest) {
  const sessionCookie = request.cookies.get('supervisor-session')
  if (!sessionCookie) return null
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Check cache first
  const cacheKey = cache.keys.sessionAnalysis(id)
  const cachedAnalysis = await cache.get(cacheKey)
  if (cachedAnalysis) {
    return NextResponse.json({ analysis: cachedAnalysis, fromCache: true })
  }

  // Fetch session
  const [sessionData] = await db
    .select()
    .from(sessions)
    .where(and(
      eq(sessions.id, id),
      eq(sessions.supervisorId, auth.supervisorId)
    ))

  if (!sessionData) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Return existing analysis if available
  if (sessionData.aiAnalysis) {
    await cache.set(cacheKey, sessionData.aiAnalysis, cache.ttl.SESSION_ANALYSIS)
    return NextResponse.json({ analysis: sessionData.aiAnalysis, fromCache: false })
  }

  // Mark as processing
  await db.update(sessions)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(sessions.id, id))

  try {
    let analysis

    const hasApiKey = !!process.env.GEMINI_API_KEY
    
    if (hasApiKey) {
      analysis = await analyzeSession(sessionData.transcript, sessionData.assignedConcept)
    } else {
      // Demo mode - use mock with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      const isRisk = sessionData.transcript.includes("better if I wasn't here") ||
                     sessionData.transcript.includes("want to hurt myself")
      analysis = generateMockAnalysis(sessionData.assignedConcept, isRisk)
    }

    // Determine status
    let newStatus: 'processed' | 'flagged_for_review' | 'safe' | 'risk'
    if (analysis.riskFlag === 'RISK') {
      newStatus = 'risk'
    } else if (shouldFlagForHumanReview(analysis)) {
      newStatus = 'flagged_for_review'
    } else {
      newStatus = 'safe'
    }

    // Save to database
    await db.update(sessions).set({
      status: newStatus,
      aiAnalysis: analysis,
      aiConfidenceScore: analysis.confidenceScore,
      aiProcessedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(sessions.id, id))

    // Cache result
    await cache.set(cacheKey, analysis, cache.ttl.SESSION_ANALYSIS)
    
    // Invalidate session list cache
    await cache.deletePattern(`sessions:${auth.supervisorId}:*`)

    return NextResponse.json({ analysis, status: newStatus })
  } catch (err) {
    // Revert status on failure
    await db.update(sessions)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(eq(sessions.id, id))

    console.error('Analysis error:', err)
    return NextResponse.json({ 
      error: 'Analysis failed. Please try again.',
      details: (err as Error).message 
    }, { status: 500 })
  }
}
