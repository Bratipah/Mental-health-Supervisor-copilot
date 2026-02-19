/**
 * Batch Processing Engine
 * 
 * Handles concurrent AI analysis of multiple sessions with:
 * - Configurable concurrency limits to avoid rate limiting
 * - Progress tracking and status updates
 * - Error isolation (one failure doesn't kill the batch)
 * - Redis-backed job status
 */

import { db } from '@/db'
import { sessions, batchJobs } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { analyzeSession, shouldFlagForHumanReview, generateMockAnalysis } from './ai-engine'
import { cache } from './cache'

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5')
const BATCH_CONCURRENCY = parseInt(process.env.BATCH_CONCURRENCY || '2')

interface BatchJobResult {
  batchId: string
  processed: number
  failed: number
  errors: Array<{ sessionId: string; error: string }>
}

// ─── Process Single Session ──────────────────────────────────────────────────

async function processSingleSession(sessionId: string): Promise<void> {
  // Mark as processing
  await db.update(sessions)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(sessions.id, sessionId))

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
  if (!session) throw new Error(`Session ${sessionId} not found`)

  let analysis

  // Use real AI if API key available, otherwise mock
  const hasApiKey = !!process.env.GEMINI_API_KEY
  
  if (hasApiKey) {
    analysis = await analyzeSession(session.transcript, session.assignedConcept)
  } else {
    // Mock for demo - detect risk from the FLAGGED transcript
    const isRiskSession = session.transcript.includes("better if I wasn't here") || 
                          session.transcript.includes("want to hurt myself") ||
                          session.transcript.includes("thinking about ending")
    analysis = generateMockAnalysis(session.assignedConcept, isRiskSession)
  }

  // Determine final status based on AI result and confidence
  let newStatus: 'processed' | 'flagged_for_review' | 'safe' | 'risk'
  
  if (analysis.riskFlag === 'RISK') {
    newStatus = 'risk'
  } else if (shouldFlagForHumanReview(analysis)) {
    newStatus = 'flagged_for_review'
  } else {
    newStatus = 'safe'
  }

  // Update session with analysis
  await db.update(sessions).set({
    status: newStatus,
    aiAnalysis: analysis,
    aiConfidenceScore: analysis.confidenceScore,
    aiProcessedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(sessions.id, sessionId))

  // Invalidate cache for this session
  await cache.delete(cache.keys.sessionAnalysis(sessionId))
  
  // Cache the new analysis
  await cache.set(
    cache.keys.sessionAnalysis(sessionId),
    analysis,
    cache.ttl.SESSION_ANALYSIS
  )
}

// ─── Process Batch ───────────────────────────────────────────────────────────

export async function processBatch(
  batchId: string,
  sessionIds: string[]
): Promise<BatchJobResult> {
  const errors: Array<{ sessionId: string; error: string }> = []
  let processed = 0

  // Update batch status to processing
  await db.update(batchJobs)
    .set({ status: 'processing', startedAt: new Date() })
    .where(eq(batchJobs.id, batchId))

  // Process in chunks with concurrency limit
  for (let i = 0; i < sessionIds.length; i += BATCH_CONCURRENCY) {
    const chunk = sessionIds.slice(i, i + BATCH_CONCURRENCY)
    
    // Process chunk concurrently
    const results = await Promise.allSettled(
      chunk.map(sessionId => processSingleSession(sessionId))
    )
    
    // Track results
    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const sessionId = chunk[j]
      
      if (result.status === 'fulfilled') {
        processed++
      } else {
        errors.push({
          sessionId,
          error: result.reason?.message || 'Unknown error'
        })
        
        // Mark failed session
        await db.update(sessions)
          .set({ status: 'pending', updatedAt: new Date() })
          .where(eq(sessions.id, sessionId))
      }
    }
    
    // Update batch progress
    await db.update(batchJobs).set({
      processedSessions: processed,
      failedSessions: errors.length,
    }).where(eq(batchJobs.id, batchId))
    
    // Update batch status cache
    await cache.set(
      cache.keys.batchStatus(batchId),
      { processed, failed: errors.length, total: sessionIds.length, status: 'processing' },
      cache.ttl.BATCH_STATUS
    )
    
    // Small delay between chunks to be rate-limit friendly
    if (i + BATCH_CONCURRENCY < sessionIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Finalize batch
  const finalStatus = errors.length === sessionIds.length ? 'failed' 
    : errors.length > 0 ? 'partial' 
    : 'completed'
    
  await db.update(batchJobs).set({
    status: finalStatus,
    processedSessions: processed,
    failedSessions: errors.length,
    completedAt: new Date(),
    errorLog: errors.map(e => ({ ...e, timestamp: new Date().toISOString() })),
  }).where(eq(batchJobs.id, batchId))
  
  // Update cache with final status
  await cache.set(
    cache.keys.batchStatus(batchId),
    { processed, failed: errors.length, total: sessionIds.length, status: finalStatus },
    cache.ttl.BATCH_STATUS
  )
  
  // Invalidate session list cache
  await cache.deletePattern('sessions:*')
  
  return { batchId, processed, failed: errors.length, errors }
}

// ─── Create Batch Job ────────────────────────────────────────────────────────

export async function createBatchJob(
  supervisorId: string,
  sessionIds: string[]
): Promise<string> {
  // Limit batch size
  const limitedIds = sessionIds.slice(0, BATCH_SIZE * 5) // max 25 at once
  
  const [job] = await db.insert(batchJobs).values({
    supervisorId,
    sessionIds: limitedIds,
    totalSessions: limitedIds.length,
    status: 'queued',
  }).returning()
  
  return job.id
}

// ─── Get Batch Status ────────────────────────────────────────────────────────

export async function getBatchStatus(batchId: string) {
  // Try cache first
  const cached = await cache.get(cache.keys.batchStatus(batchId))
  if (cached) return cached
  
  const [job] = await db.select().from(batchJobs).where(eq(batchJobs.id, batchId))
  if (!job) return null
  
  return {
    id: job.id,
    status: job.status,
    total: job.totalSessions,
    processed: job.processedSessions,
    failed: job.failedSessions,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  }
}
