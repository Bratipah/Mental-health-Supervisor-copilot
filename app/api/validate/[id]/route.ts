import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sessions, auditLog } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { cache } from '@/lib/cache'
import { z } from 'zod'

const ValidateSchema = z.object({
  action: z.enum(['validated', 'rejected', 'overridden_safe', 'overridden_risk']),
  note: z.string().max(2000).optional(),
})

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

  const body = await request.json()
  const parsed = ValidateSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 })
  }

  const { action, note } = parsed.data

  // Fetch current session
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

  // Determine new status based on action
  let newStatus: 'safe' | 'risk' | 'processed' | 'flagged_for_review'
  switch (action) {
    case 'validated':
      newStatus = sessionData.status as any
      break
    case 'rejected':
      newStatus = 'flagged_for_review'
      break
    case 'overridden_safe':
      newStatus = 'safe'
      break
    case 'overridden_risk':
      newStatus = 'risk'
      break
    default:
      newStatus = sessionData.status as any
  }

  // Save audit log entry
  await db.insert(auditLog).values({
    supervisorId: auth.supervisorId,
    sessionId: id,
    action,
    previousValue: { status: sessionData.status, action: sessionData.supervisorAction },
    newValue: { status: newStatus, action },
    note: note || null,
  })

  // Update session
  await db.update(sessions).set({
    status: newStatus,
    supervisorAction: action,
    supervisorNote: note || null,
    supervisorReviewedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(sessions.id, id))

  // Invalidate caches
  await cache.delete(cache.keys.sessionAnalysis(id))
  await cache.deletePattern(`sessions:${auth.supervisorId}:*`)

  return NextResponse.json({ 
    success: true, 
    newStatus,
    message: action === 'validated' 
      ? 'AI assessment confirmed' 
      : action === 'overridden_safe' 
        ? 'Status overridden to SAFE'
        : action === 'overridden_risk'
          ? 'Status overridden to RISK'
          : 'Flagged for further review'
  })
}
