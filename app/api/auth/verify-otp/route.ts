import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { signJwtToken } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and 6-digit code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please request a new OTP.' }, { status: 404 });
    }

    // Find valid unused OTP
    const validOtp = await prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) {
      return NextResponse.json({ error: 'Invalid or expired 6-digit verification code.' }, { status: 400 });
    }

    // Mark OTP as used
    await prisma.otpToken.update({
      where: { id: validOtp.id },
      data: { used: true },
    });

    // Production DB Maintenance: Purge expired and old used OTP tokens (TTL cleanup)
    try {
      await prisma.otpToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { used: true },
          ],
        },
      });
    } catch (cleanErr) {
      // Ignore background cleanup errors
    }

    // Mark user as verified and automatically bind Jira email to sign-in email
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        jiraEmail: email,
      },
    });

    // Sign JWT token for secure token-based authentication
    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      jiraAccountId: user.jiraAccountId,
    });

    const response = NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Authentication successful!',
    });

    // Set HTTP-only JWT session cookie
    response.cookies.set('spyrobo_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[VerifyOTP Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
