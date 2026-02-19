import { NextRequest, NextResponse } from 'next/server'
import { createBatchJob, processBatch, getBatchStatus } from '@/lib/batch-processor'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'

const BatchSchema = z.object({
  sessionIds: z.array(z.string().uuid()).min(1).max(25),
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

export async function POST(request: NextRequest) {
  const auth = getAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = BatchSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { sessionIds } = parsed.data

  // Verify all sessions belong to this supervisor
  const supervisorSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(
      eq(sessions.supervisorId, auth.supervisorId),
      inArray(sessions.id, sessionIds)
    ))

  if (supervisorSessions.length !== sessionIds.length) {
    return NextResponse.json({ error: 'Some sessions not found or unauthorized' }, { status: 403 })
  }

  // Create batch job
  const batchId = await createBatchJob(auth.supervisorId, sessionIds)

  // Process async (in production this would be a background job/queue)
  // For demo, we process immediately but return the batchId for polling
  processBatch(batchId, sessionIds).catch(err => {
    console.error('Batch processing error:', err)
  })

  return NextResponse.json({ batchId, sessionCount: sessionIds.length })
}

export async function GET(request: NextRequest) {
  const auth = getAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')
  
  if (!batchId) {
    return NextResponse.json({ error: 'batchId required' }, { status: 400 })
  }

  const status = await getBatchStatus(batchId)
  if (!status) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }

  return NextResponse.json(status)
}
