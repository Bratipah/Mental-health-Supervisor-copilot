import { NextRequest, NextResponse } from 'next/server'
import { registerSupervisor } from '@/lib/auth'
import { z } from 'zod'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  organization: z.string().min(2, 'Organization name required').max(200),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const result = await registerSupervisor(parsed.data)

    if (!result.success || !result.session) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    // Auto sign-in after registration — set the session cookie
    const response = NextResponse.json({
      success: true,
      supervisor: { name: result.session.name },
    })

    response.cookies.set('supervisor-session', JSON.stringify(result.session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Register route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
