import { NextRequest, NextResponse } from 'next/server'
import { validateCredentials } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const session = await validateCredentials(email, password)

    if (!session) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, supervisor: { name: session.name } })
    
    // Set session cookie
    response.cookies.set('supervisor-session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
