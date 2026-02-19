import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sessions, fellows } from '@/db/schema'
import { eq, desc, and, or } from 'drizzle-orm'
import { cache } from '@/lib/cache'
import { cookies } from 'next/headers'

function getSession(request: NextRequest) {
  const cookieStore = request.cookies
  const sessionCookie = cookieStore.get('supervisor-session')
  if (!sessionCookie) return null
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const session = getSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || 'all'
  const limit = 10

  // Try cache
  const cacheKey = `${cache.keys.sessionList(session.supervisorId, page)}:${status}`
  const cached = await cache.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    // Get sessions with fellow info
    const allSessions = await db
      .select({
        id: sessions.id,
        groupId: sessions.groupId,
        sessionDate: sessions.sessionDate,
        durationMinutes: sessions.durationMinutes,
        assignedConcept: sessions.assignedConcept,
        status: sessions.status,
        aiConfidenceScore: sessions.aiConfidenceScore,
        supervisorAction: sessions.supervisorAction,
        supervisorReviewedAt: sessions.supervisorReviewedAt,
        aiProcessedAt: sessions.aiProcessedAt,
        batchId: sessions.batchId,
        createdAt: sessions.createdAt,
        fellowName: fellows.name,
        fellowEmail: fellows.email,
        fellowId: fellows.id,
      })
      .from(sessions)
      .innerJoin(fellows, eq(sessions.fellowId, fellows.id))
      .where(eq(sessions.supervisorId, session.supervisorId))
      .orderBy(desc(sessions.sessionDate))
      .limit(100) // Get all, filter client side for now

    // Stats
    const stats = {
      total: allSessions.length,
      risk: allSessions.filter(s => s.status === 'risk').length,
      flagged: allSessions.filter(s => s.status === 'flagged_for_review').length,
      pending: allSessions.filter(s => s.status === 'pending' || s.status === 'processing').length,
      safe: allSessions.filter(s => s.status === 'safe').length,
      processed: allSessions.filter(s => s.status === 'processed').length,
    }

    // Filter
    let filtered = allSessions
    if (status !== 'all') {
      filtered = allSessions.filter(s => s.status === status)
    }

    // Paginate
    const offset = (page - 1) * limit
    const paginated = filtered.slice(offset, offset + limit)
    const totalPages = Math.ceil(filtered.length / limit)

    const result = {
      sessions: paginated,
      stats,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages,
      }
    }

    // Cache for 3 minutes
    await cache.set(cacheKey, result, cache.ttl.SUPERVISOR_SESSIONS)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Sessions fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
