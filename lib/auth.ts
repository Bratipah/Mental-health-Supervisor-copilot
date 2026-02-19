import { db } from '@/db'
import { supervisors } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Simplified auth for demo - in production use NextAuth v5 or Lucia
export interface Session {
  supervisorId: string
  name: string
  email: string
}

// Demo auth - checks against database
export async function validateCredentials(email: string, password: string): Promise<Session | null> {
  try {
    const [supervisor] = await db.select().from(supervisors).where(eq(supervisors.email, email))
    
    if (!supervisor) return null
    
    // For demo: accept 'demo123' as password for seeded supervisor
    // In production: use bcrypt.compare(password, supervisor.passwordHash)
    const isValid = password === 'demo123' && email === 'supervisor@copilot.demo'
    
    if (!isValid) return null
    
    return {
      supervisorId: supervisor.id,
      name: supervisor.name,
      email: supervisor.email,
    }
  } catch (err) {
    console.error('Auth error:', err)
    return null
  }
}
