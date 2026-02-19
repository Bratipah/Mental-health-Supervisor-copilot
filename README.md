# Supervisor Copilot
### AI-Powered Session Quality Assurance for the Tiered Care Model
**Ghana Youth Mental Health Initiative**

---

## Overview

Supervisor Copilot is a web-based dashboard that amplifies a Tier 2 Supervisor's capacity to review group therapy sessions delivered by Fellows (lay providers, 18-22 years old) at scale. Using generative AI, it analyzes session transcripts to surface quality indicators, risk flags, and actionable insights — turning 60-minute reviews into 2-minute decisions, while keeping humans firmly in the loop.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 App                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Dashboard  │  │  AI Analysis │  │  Batch Proc. │  │
│  │  (Sessions   │  │   Engine     │  │   Engine     │  │
│  │   List/View) │  │  (Zod + LLM) │  │  (p-queue)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│           │               │                  │           │
│  ┌────────▼───────────────▼──────────────────▼────────┐ │
│  │                 API Routes (Next.js)                │ │
│  │  /api/sessions  /api/analysis  /api/batch           │ │
│  │  /api/validate  /api/auth                           │ │
│  └──────────┬───────────────────────────────┬──────────┘ │
│             │                               │            │
│  ┌──────────▼──────┐              ┌─────────▼──────────┐ │
│  │  Neon PostgreSQL │              │    Redis Cache     │ │
│  │  (via Drizzle)  │              │  (AI results, TTL) │ │
│  └─────────────────┘              └────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Model

- **Supervisors**: Tier 2 oversight personnel (login, organization)
- **Fellows**: Lay providers (18-22), linked to supervisor, group assignments
- **Sessions**: Therapy recordings with transcript, metadata, AI analysis, supervisor review
- **BatchJobs**: Async processing queue with status tracking
- **AuditLog**: Complete history of supervisor decisions (human-AI policy compliance)

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Neon account (free tier works): https://neon.tech
- Redis instance (local, Upstash, or Railway)
- OpenAI or Anthropic API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd supervisor-copilot
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Redis (local dev: redis://localhost:6379)
REDIS_URL="redis://localhost:6379"

# AI Provider (at least one required)
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."

# AI Configuration
AI_CONFIDENCE_THRESHOLD="0.75"  # Below this, auto-flag for review
BATCH_SIZE="5"                   # Sessions per batch
BATCH_CONCURRENCY="2"           # Concurrent AI calls
```

### 3. Database Setup

```bash
# Push schema to Neon
npm run db:push

# Seed with 10 demo sessions + realistic transcripts
npm run db:seed
```

### 4. Run

```bash
npm run dev
# Open http://localhost:3000
# Login: supervisor@copilot.demo / demo123
```

---

## Core Features

### A. Dashboard
- Lists 10+ completed sessions with Fellow name, date, group ID, status
- Real-time stats panel (Risk count, pending, safe)
- Urgent RISK banner with immediate visual alert
- Status filtering (All, Risk, Needs Review, Pending, Safe)
- One-click batch analysis of pending sessions

### B. AI Analysis Engine
- **Session Summary**: 3-sentence evidence-based summary
- **Quantitative Scores** (0-10) with justification:
  - Concept Adherence (was the assigned concept taught?)
  - Participant Engagement
  - Safety Protocol Adherence
  - Therapeutic Alliance
- **Risk Detection**: Binary SAFE/RISK flag with:
  - Exact quote extraction
  - Severity classification (low/medium/high/critical)
  - Recommended supervisor action
- **Confidence Scoring**: Threshold-based auto-flagging at 75%
- **Zod Schema Enforcement**: Strict validation of all AI outputs

### C. Supervisor Review (Human-AI Collaboration)
- Confirm AI assessment
- Override SAFE → RISK or RISK → SAFE
- Flag for further review
- Add supervisor notes (full audit trail)
- All decisions logged in audit_log table

### D. Batch Processing
- Process multiple pending sessions concurrently
- Configurable concurrency (BATCH_CONCURRENCY env)
- Real-time progress bar with polling
- Error isolation per session
- Redis-cached progress status

### E. Caching Strategy (Redis)
- AI analysis results: 24-hour TTL
- Session list: 5-minute TTL
- Batch status: 2-minute TTL
- Graceful degradation if Redis unavailable

---

## AI Confidence Threshold Agent

The system implements automatic decision-making based on AI confidence:

```typescript
// Confidence thresholds
HIGH: 0.75+    → Reliable, display normally
MEDIUM: 0.55+  → Review carefully
LOW: 0.40+     → Human review recommended
VERY_LOW: <0.40 → Auto-flag for review

// Auto-flagging rules
if (riskFlag === 'RISK') → status = 'risk' (always)
if (confidenceScore < 0.60) → status = 'flagged_for_review'
if (qualityScore < 3) → status = 'flagged_for_review'
```

---

## AI Usage Documentation

### How Claude (AI) Was Used

This project was built using Claude as an AI coding partner. Here's the breakdown:

#### AI-Generated (with human direction + review):
1. **Database schema** (`db/schema.ts`) — Claude suggested Drizzle ORM patterns; I reviewed table relationships and added the audit_log concept
2. **Mock transcripts** — Claude generated realistic 40-60 minute therapy session text; I validated they contained proper CBT/group therapy language and added the risk scenario manually
3. **Boilerplate components** — Navigation, layout structure, initial Tailwind classes
4. **API route structure** — Basic CRUD patterns; I added caching layer, error handling, and authorization checks
5. **Seed file** — Claude generated the SQL structure; I curated which transcripts to use and ensured the risk scenario was realistic

#### Hand-Coded (critical path, zero AI):
1. **AI confidence threshold logic** — The thresholds (75%, 55%, 40%) and the shouldFlagForHumanReview function were designed by me based on understanding the safety requirements
2. **Risk detection prompt engineering** — The defensive prompt design emphasizing "err on side of flagging" was my deliberate safety decision
3. **Human-AI collaboration policy** — The decision to require human validation for all RISK flags, the audit log design, and the override flow were all deliberate design choices
4. **Caching strategy** — Redis TTL values and the graceful degradation pattern were hand-designed
5. **Batch concurrency design** — The rate-limiting approach and chunk-based processing
6. **Session status state machine** — pending → processing → safe/risk/flagged logic

#### How I Verified AI Code Quality:
- Reviewed all Drizzle schema definitions against Neon's PostgreSQL docs
- Manually traced auth flow (cookie → middleware → API → DB)
- Checked all AI prompt outputs against Zod schema manually
- Reviewed batch processor for race conditions
- Verified cache invalidation logic was correct (not caching stale risk status)

---

## Security & Compliance Notes

1. **Cookie-based auth** with httpOnly flag prevents XSS token theft
2. **Supervisor-scoped queries** — every DB query filters by supervisorId (no cross-supervisor data leakage)
3. **Input validation** via Zod on all API routes
4. **AI output validation** via Zod — malformed AI responses are rejected, not silently accepted
5. **Audit trail** — all supervisor decisions logged with timestamps and previous values
6. **Human override** — no AI decision is final; supervisors can always override

---

## Scalability Design

For 10M youth coverage:

- **Neon serverless PostgreSQL** — scales to millions of rows, connection pooling built-in
- **Redis caching** — reduces DB reads by 80%+ for repeated analysis views
- **Batch processing** — process 5-25 sessions concurrently rather than one-by-one
- **Background queue** — in production, use BullMQ or AWS SQS for batch jobs
- **AI cost optimization** — cache analysis results for 24 hours; avoid re-analysis unless transcript changes

---

## Demo Credentials

```
Email: supervisor@copilot.demo
Password: demo123
```

The seeded data includes:
- Session 3 (Efua Asante, GRP-003-TAKORADI) — contains **suicidal ideation disclosure**, will be flagged as RISK
- Mix of SAFE, Processed, Pending, and Flagged sessions
- Realistic 40-60 minute transcripts covering Growth Mindset, Emotional Regulation, Resilience, Healthy Relationships, Self-Compassion
# Mental-health-Supervisor-copilot
