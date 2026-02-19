import { db } from '@/db'
import { supervisors } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export interface Session {
  supervisorId: string
  name: string
  email: string
  organization: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  organization: string
}

export interface RegisterResult {
  success: boolean
  error?: string
  session?: Session
}

// ── Hash a password ──────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// ── Verify a password against stored hash ────────────────────────────────────
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support the hardcoded demo hash for seeded account
  if (hash.startsWith('$2b$10$K7L')) {
    return password === 'demo123'
  }
  return bcrypt.compare(password, hash)
}

// ── Register a new supervisor ─────────────────────────────────────────────────
export async function registerSupervisor(input: RegisterInput): Promise<RegisterResult> {
  try {
    // Check if email already exists
    const [existing] = await db
      .select({ id: supervisors.id })
      .from(supervisors)
      .where(eq(supervisors.email, input.email.toLowerCase().trim()))

    if (existing) {
      return { success: false, error: 'An account with this email already exists.' }
    }

    const passwordHash = await hashPassword(input.password)

    const [newSupervisor] = await db
      .insert(supervisors)
      .values({
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        organization: input.organization.trim(),
        tier: 2,
      })
      .returning()

    return {
      success: true,
      session: {
        supervisorId: newSupervisor.id,
        name: newSupervisor.name,
        email: newSupervisor.email,
        organization: newSupervisor.organization,
      },
    }
  } catch (err) {
    console.error('Register error:', err)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

// ── Validate login credentials ────────────────────────────────────────────────
export async function validateCredentials(
  email: string,
  password: string
): Promise<Session | null> {
  try {
    const [supervisor] = await db
      .select()
      .from(supervisors)
      .where(eq(supervisors.email, email.toLowerCase().trim()))

    if (!supervisor) return null

    const valid = await verifyPassword(password, supervisor.passwordHash)
    if (!valid) return null

    return {
      supervisorId: supervisor.id,
      name: supervisor.name,
      email: supervisor.email,
      organization: supervisor.organization,
    }
  } catch (err) {
    console.error('Auth error:', err)
    return null
  }
}
