import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400 })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const adminHash = process.env.ADMIN_PASSWORD_HASH

    if (!adminEmail || !adminHash) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD_HASH not configured')
      return NextResponse.json({ error: 'Server configuratiefout' }, { status: 500 })
    }

    // Verify credentials
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, adminHash)
    if (!valid) {
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 })
    }

    // Create session
    await createSession(email)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Inloggen mislukt' }, { status: 500 })
  }
}
