/**
 * AI Analysis Engine
 * 
 * Core AI integration layer for the Supervisor Copilot.
 * Features:
 * - Structured output with Zod validation
 * - Confidence scoring with threshold-based flagging
 * - Defensive prompting to prevent hallucination
 * - Retry logic with exponential backoff
 * - Powered by Google Gemini (gemini-1.5-pro)
 */

import { z } from 'zod'
import type { AIAnalysis, ConceptScore, QuantitativeScore, RiskDetail } from '@/db/schema'

// ─── Zod Schemas (Output Enforcement) ───────────────────────────────────────

const RiskDetailSchema = z.object({
  type: z.enum(['self_harm', 'crisis', 'abuse', 'safeguarding', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  quote: z.string().min(1, 'Quote must not be empty'),
  context: z.string().min(1, 'Context must not be empty'),
  recommendedAction: z.string().min(1, 'Recommended action must not be empty'),
})

const QuantitativeScoreSchema = z.object({
  score: z.number().min(0).max(10),
  justification: z.string().min(10, 'Justification too short'),
  evidence: z.string().min(10, 'Evidence too short'),
})

const ConceptScoreSchema = z.object({
  score: z.number().min(0).max(10),
  conceptTaught: z.boolean(),
  conceptName: z.string(),
  evidence: z.string().min(10),
  justification: z.string().min(10),
})

export const AIAnalysisSchema = z.object({
  summary: z.string()
    .min(100, 'Summary must be at least 3 sentences')
    .max(1000, 'Summary too long'),
  conceptAdherence: ConceptScoreSchema,
  participantEngagement: QuantitativeScoreSchema,
  safetyProtocol: QuantitativeScoreSchema,
  therapeuticAlliance: QuantitativeScoreSchema,
  riskFlag: z.enum(['SAFE', 'RISK']),
  riskDetails: z.array(RiskDetailSchema).optional().default([]),
  overallQualityScore: z.number().min(0).max(10),
  confidenceScore: z.number().min(0).max(1),
  keyStrengths: z.array(z.string()).min(1).max(5),
  areasForImprovement: z.array(z.string()).min(1).max(5),
})

export type ValidatedAIAnalysis = z.infer<typeof AIAnalysisSchema>

// ─── Confidence Thresholds ───────────────────────────────────────────────────

export const CONFIDENCE_CONFIG = {
  HIGH: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.75'),
  MEDIUM: 0.55,
  LOW: 0.40,
  
  // If confidence is below this, flag for human review regardless of risk status
  AUTO_REVIEW_THRESHOLD: 0.60,
}

export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' | 'very_low' {
  if (score >= CONFIDENCE_CONFIG.HIGH) return 'high'
  if (score >= CONFIDENCE_CONFIG.MEDIUM) return 'medium'
  if (score >= CONFIDENCE_CONFIG.LOW) return 'low'
  return 'very_low'
}

export function shouldFlagForHumanReview(analysis: AIAnalysis): boolean {
  // Always flag risk sessions
  if (analysis.riskFlag === 'RISK') return true
  
  // Flag if AI confidence is below threshold
  if (analysis.confidenceScore < CONFIDENCE_CONFIG.AUTO_REVIEW_THRESHOLD) return true
  
  // Flag if quality score is very low
  if (analysis.overallQualityScore < 3) return true
  
  return false
}

// ─── Prompt Engineering ──────────────────────────────────────────────────────

function buildAnalysisPrompt(transcript: string, assignedConcept: string): string {
  return `You are an expert mental health quality assurance system for the Ghana Youth Mental Health Initiative's Tiered Care Model. You analyze therapy session transcripts conducted by Fellows (lay providers aged 18-22) who deliver group therapy to young people.

Your role is to assist Tier 2 Supervisors in quality assurance. Your analysis will be reviewed by a human supervisor before any action is taken.

ASSIGNED CONCEPT FOR THIS SESSION: "${assignedConcept}"

TRANSCRIPT:
${transcript}

ANALYSIS INSTRUCTIONS:
Analyze the above therapy session transcript and provide a structured JSON response. Be accurate, evidence-based, and cite specific quotes from the transcript.

CRITICAL SAFETY REQUIREMENT: 
- Scan thoroughly for ANY indication of: suicidal ideation, self-harm, crisis, abuse disclosure, or safeguarding concerns
- If ANY such content exists, set riskFlag to "RISK" and extract the EXACT quotes
- Err on the side of flagging uncertain cases as RISK - a human supervisor will review

CONFIDENCE SCORING GUIDANCE:
- Rate your confidence in each assessment from 0 to 1
- Consider: transcript length, transcript clarity, presence of key indicators
- Lower confidence if: transcript is very short, ambiguous, or missing key sections
- Your confidenceScore should reflect overall certainty in the complete analysis

Respond ONLY with valid JSON matching this exact structure:
{
  "summary": "3-sentence summary of the session covering: what happened, how the Fellow performed, and key outcomes",
  "conceptAdherence": {
    "score": 0-10,
    "conceptTaught": true/false,
    "conceptName": "${assignedConcept}",
    "evidence": "Direct quote or specific example showing concept teaching",
    "justification": "Why this score was assigned"
  },
  "participantEngagement": {
    "score": 0-10,
    "justification": "Assessment of youth engagement and participation",
    "evidence": "Specific examples of engagement or lack thereof"
  },
  "safetyProtocol": {
    "score": 0-10,
    "justification": "How well did the Fellow follow safety and therapeutic protocols",
    "evidence": "Specific examples of protocol adherence or violations"
  },
  "therapeuticAlliance": {
    "score": 0-10,
    "justification": "Quality of the therapeutic relationship and group cohesion",
    "evidence": "Specific examples of alliance-building behaviors"
  },
  "riskFlag": "SAFE" or "RISK",
  "riskDetails": [
    {
      "type": "self_harm|crisis|abuse|safeguarding|other",
      "severity": "low|medium|high|critical",
      "quote": "EXACT verbatim quote from transcript",
      "context": "Context around this quote",
      "recommendedAction": "Specific recommended supervisor action"
    }
  ],
  "overallQualityScore": 0-10,
  "confidenceScore": 0.0-1.0,
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"]
}

IMPORTANT: 
- riskDetails should be an empty array [] if riskFlag is SAFE
- If riskFlag is RISK, riskDetails MUST contain at least one entry with an exact quote
- All scores must be numbers between 0 and 10
- confidenceScore must be between 0.0 and 1.0
- Return ONLY the JSON object, no other text`
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────

async function analyzeWithGemini(
  transcript: string,
  assignedConcept: string
): Promise<ValidatedAIAnalysis> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: {
      temperature: 0.1,       // Low temp for reliable, consistent JSON
      maxOutputTokens: 2048,
      responseMimeType: 'application/json', // Forces Gemini to return pure JSON
    },
  })

  const prompt = buildAnalysisPrompt(transcript, assignedConcept)
  const result = await model.generateContent(prompt)
  const rawText = result.response.text()

  if (!rawText) throw new Error('No response from Gemini')

  // Strip any accidental markdown fences (defensive)
  const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim()

  const parsed = JSON.parse(cleaned)
  return AIAnalysisSchema.parse(parsed)
}

// ─── Retry Logic ─────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error

      // Don't retry Zod validation errors (schema mismatch won't fix itself)
      if (lastError.name === 'ZodError') {
        console.warn(`Validation error on attempt ${attempt + 1}:`, lastError.message)
        if (attempt === maxRetries - 1) throw lastError
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Gemini attempt ${attempt + 1} failed. Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// ─── Main Analysis Function ──────────────────────────────────────────────────

export async function analyzeSession(
  transcript: string,
  assignedConcept: string
): Promise<ValidatedAIAnalysis> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey')
  }

  return withRetry(() => analyzeWithGemini(transcript, assignedConcept))
}

// ─── Mock Analysis (for development without API key) ─────────────────────────

export function generateMockAnalysis(
  assignedConcept: string,
  hasRisk: boolean = false
): ValidatedAIAnalysis {
  if (hasRisk) {
    return {
      summary: `This session covered ${assignedConcept} with engaged group participation. A critical moment occurred when a participant disclosed passive suicidal ideation and feelings of being a burden. The Fellow responded appropriately by directly assessing intent and referring to supervisor support.`,
      conceptAdherence: {
        score: 7.5,
        conceptTaught: true,
        conceptName: assignedConcept,
        evidence: 'Fellow introduced concept with research backing and provided practical exercises.',
        justification: 'Concept was taught comprehensively despite session interruption for crisis response.',
      },
      participantEngagement: {
        score: 8,
        justification: 'High engagement with meaningful personal disclosures.',
        evidence: 'Multiple participants shared personal experiences and asked thoughtful questions.',
      },
      safetyProtocol: {
        score: 9,
        justification: 'Excellent crisis response - direct assessment, non-judgmental approach, immediate supervisor referral.',
        evidence: 'Fellow directly asked about suicidal ideation, stayed with participant, followed safeguarding protocol.',
      },
      therapeuticAlliance: {
        score: 8.5,
        justification: 'Strong group cohesion evident in supportive responses to vulnerable sharing.',
        evidence: 'Group members expressed empathy and solidarity with the participant in crisis.',
      },
      riskFlag: 'RISK',
      riskDetails: [
        {
          type: 'self_harm',
          severity: 'high',
          quote: "I've been thinking that maybe it would be better if I wasn't here. Like, everyone would have one less problem to worry about.",
          context: 'Participant disclosed this during check-in. Expressed hopelessness related to family financial crisis and brother leaving.',
          recommendedAction: 'Review Fellow\'s crisis response. Confirm participant was seen by clinical supervisor. Schedule follow-up assessment within 48 hours.',
        }
      ],
      overallQualityScore: 8,
      confidenceScore: 0.87,
      keyStrengths: [
        'Excellent crisis intervention and de-escalation',
        'Direct and non-judgmental assessment of suicidal ideation',
        'Appropriate supervisor referral with same-day follow-through',
      ],
      areasForImprovement: [
        'Could have asked about other group members earlier in crisis moment',
        'Safety planning with participant could have been more explicit',
      ],
    }
  }

  return {
    summary: `This session effectively covered ${assignedConcept} with clear pedagogical structure and strong participant engagement. The Fellow demonstrated good facilitation skills, using evidence-based examples and interactive exercises. Participants showed meaningful understanding of the concept by the end of the session.`,
    conceptAdherence: {
      score: 8.5,
      conceptTaught: true,
      conceptName: assignedConcept,
      evidence: 'Fellow introduced the concept with research backing, used concrete examples, and facilitated practical exercises.',
      justification: 'Concept was taught comprehensively with appropriate depth for the age group.',
    },
    participantEngagement: {
      score: 7.8,
      justification: 'Most participants actively contributed to discussions with meaningful personal sharing.',
      evidence: 'Multiple check-in responses, voluntary sharing, and follow-up questions from participants.',
    },
    safetyProtocol: {
      score: 8.2,
      justification: 'Fellow followed all standard protocols, maintained safe space, and responded appropriately to participant emotions.',
      evidence: 'Regular check-ins, non-judgmental responses, appropriate boundaries maintained throughout.',
    },
    therapeuticAlliance: {
      score: 8,
      justification: 'Strong rapport evident between Fellow and group; participants comfortable sharing personal experiences.',
      evidence: 'Participants volunteered personal examples, expressed appreciation, showed trust.',
    },
    riskFlag: 'SAFE',
    riskDetails: [],
    overallQualityScore: 8.1,
    confidenceScore: 0.82,
    keyStrengths: [
      `Clear and engaging teaching of ${assignedConcept}`,
      'Effective use of evidence and practical examples',
      'Strong group facilitation with inclusive participation',
    ],
    areasForImprovement: [
      'Could dedicate more time to application and practice',
      'Follow-up questions could deepen individual reflection',
    ],
  }
}
