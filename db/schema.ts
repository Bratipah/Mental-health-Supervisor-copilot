import { 
  pgTable, 
  text, 
  timestamp, 
  integer, 
  boolean, 
  jsonb,
  real,
  uuid,
  pgEnum,
  index
} from 'drizzle-orm/pg-core'

// ─── Enums ──────────────────────────────────────────────────────────────────

export const sessionStatusEnum = pgEnum('session_status', [
  'pending',
  'processing', 
  'processed',
  'flagged_for_review',
  'safe',
  'risk'
])

export const riskFlagEnum = pgEnum('risk_flag', ['SAFE', 'RISK'])

export const supervisorActionEnum = pgEnum('supervisor_action', [
  'validated',
  'rejected',
  'overridden_safe',
  'overridden_risk',
  'pending_review'
])

export const batchStatusEnum = pgEnum('batch_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'partial'
])

// ─── Supervisors Table ───────────────────────────────────────────────────────

export const supervisors = pgTable('supervisors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  tier: integer('tier').notNull().default(2),
  organization: text('organization').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('supervisors_email_idx').on(table.email),
}))

// ─── Fellows Table ───────────────────────────────────────────────────────────

export const fellows = pgTable('fellows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age'),
  supervisorId: uuid('supervisor_id').references(() => supervisors.id).notNull(),
  groupIds: jsonb('group_ids').$type<string[]>().default([]),
  cohort: text('cohort').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  supervisorIdx: index('fellows_supervisor_idx').on(table.supervisorId),
}))

// ─── Sessions Table ──────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fellowId: uuid('fellow_id').references(() => fellows.id).notNull(),
  supervisorId: uuid('supervisor_id').references(() => supervisors.id).notNull(),
  groupId: text('group_id').notNull(),
  sessionDate: timestamp('session_date').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  assignedConcept: text('assigned_concept').notNull(),
  transcript: text('transcript').notNull(),
  transcriptWordCount: integer('transcript_word_count').notNull().default(0),
  status: sessionStatusEnum('status').default('pending').notNull(),
  // AI Analysis Results
  aiAnalysis: jsonb('ai_analysis').$type<AIAnalysis | null>().default(null),
  aiConfidenceScore: real('ai_confidence_score'),
  aiProcessedAt: timestamp('ai_processed_at'),
  // Supervisor Review
  supervisorAction: supervisorActionEnum('supervisor_action'),
  supervisorNote: text('supervisor_note'),
  supervisorReviewedAt: timestamp('supervisor_reviewed_at'),
  supervisorId2: uuid('supervisor_reviewed_by').references(() => supervisors.id),
  // Batch processing
  batchId: uuid('batch_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  fellowIdx: index('sessions_fellow_idx').on(table.fellowId),
  supervisorIdx: index('sessions_supervisor_idx').on(table.supervisorId),
  statusIdx: index('sessions_status_idx').on(table.status),
  dateIdx: index('sessions_date_idx').on(table.sessionDate),
  batchIdx: index('sessions_batch_idx').on(table.batchId),
}))

// ─── Batch Jobs Table ────────────────────────────────────────────────────────

export const batchJobs = pgTable('batch_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  supervisorId: uuid('supervisor_id').references(() => supervisors.id).notNull(),
  status: batchStatusEnum('status').default('queued').notNull(),
  totalSessions: integer('total_sessions').notNull(),
  processedSessions: integer('processed_sessions').default(0).notNull(),
  failedSessions: integer('failed_sessions').default(0).notNull(),
  sessionIds: jsonb('session_ids').$type<string[]>().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorLog: jsonb('error_log').$type<BatchError[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  supervisorIdx: index('batch_jobs_supervisor_idx').on(table.supervisorId),
  statusIdx: index('batch_jobs_status_idx').on(table.status),
}))

// ─── Audit Log Table ─────────────────────────────────────────────────────────

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  supervisorId: uuid('supervisor_id').references(() => supervisors.id).notNull(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  action: text('action').notNull(),
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── TypeScript Types ────────────────────────────────────────────────────────

export interface AIAnalysis {
  summary: string
  conceptAdherence: ConceptScore
  participantEngagement: QuantitativeScore
  safetyProtocol: QuantitativeScore
  therapeuticAlliance: QuantitativeScore
  riskFlag: 'SAFE' | 'RISK'
  riskDetails?: RiskDetail[]
  overallQualityScore: number
  confidenceScore: number
  keyStrengths: string[]
  areasForImprovement: string[]
  rawTokensUsed?: number
}

export interface ConceptScore {
  score: number // 0-10
  conceptTaught: boolean
  conceptName: string
  evidence: string
  justification: string
}

export interface QuantitativeScore {
  score: number // 0-10
  justification: string
  evidence: string
}

export interface RiskDetail {
  type: 'self_harm' | 'crisis' | 'abuse' | 'safeguarding' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  quote: string
  context: string
  recommendedAction: string
}

export interface BatchError {
  sessionId: string
  error: string
  timestamp: string
}
