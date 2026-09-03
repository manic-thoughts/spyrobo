import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (user) {
      return NextResponse.json({ authenticated: true, user });
    }

    // Fallback unauthenticated or default user
    return NextResponse.json({
      authenticated: false,
      user: {
        email: 'guest@spyrobo.app',
        jiraEmail: 'guest@spyrobo.app',
        displayName: 'Guest Developer',
        isVerified: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
