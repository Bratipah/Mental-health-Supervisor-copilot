import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sessions, fellows } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { cache } from '@/lib/cache'

function getSession(request: NextRequest) {
  const sessionCookie = request.cookies.get('supervisor-session')
  if (!sessionCookie) return null
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getSession(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const [sessionData] = await db
      .select({
        id: sessions.id,
        groupId: sessions.groupId,
        sessionDate: sessions.sessionDate,
        durationMinutes: sessions.durationMinutes,
        assignedConcept: sessions.assignedConcept,
        status: sessions.status,
        transcript: sessions.transcript,
        aiAnalysis: sessions.aiAnalysis,
        aiConfidenceScore: sessions.aiConfidenceScore,
        aiProcessedAt: sessions.aiProcessedAt,
        supervisorAction: sessions.supervisorAction,
        supervisorNote: sessions.supervisorNote,
        supervisorReviewedAt: sessions.supervisorReviewedAt,
        batchId: sessions.batchId,
        createdAt: sessions.createdAt,
        fellowName: fellows.name,
        fellowId: fellows.id,
        fellowEmail: fellows.email,
      })
      .from(sessions)
      .innerJoin(fellows, eq(sessions.fellowId, fellows.id))
      .where(and(
        eq(sessions.id, id),
        eq(sessions.supervisorId, auth.supervisorId)
      ))

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(sessionData)
  } catch (err) {
    console.error('Session fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
