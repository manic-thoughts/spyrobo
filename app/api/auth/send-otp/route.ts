import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendOtpEmail } from '@/lib/auth/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    console.log(`[API /api/auth/send-otp] Received OTP request for email: ${email}`);

    if (!email || !email.includes('@')) {
      console.warn(`[API /api/auth/send-otp] Invalid email provided: "${email}"`);
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        displayName: email.split('@')[0],
      },
    });

    console.log(`[API /api/auth/send-otp] User record upserted: ID=${user.id}, email=${user.email}`);

    // 2. Production DB Maintenance: Clean up old expired/used OTPs for this user
    try {
      await prisma.otpToken.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            { expiresAt: { lt: new Date() } },
          ],
        },
      });
    } catch (cleanErr) {
      // Ignore background cleanup errors
    }

    // 3. Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 4. Save to OtpToken
    await prisma.otpToken.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiresAt,
      },
    });

    console.log(`[API /api/auth/send-otp] OTP record saved to DB: code=${otpCode}, expiresAt=${expiresAt.toISOString()}`);

    // 5. Send Email via Brevo SMTP
    const sent = await sendOtpEmail({ toEmail: email, otpCode });

    return NextResponse.json({
      success: true,
      email,
      sent,
      message: `A 6-digit verification code has been generated for ${email}.`,
      // Always output devCode if SMTP credentials are not configured or in development mode
      devCode: (!process.env.SMTP_USER || process.env.NODE_ENV === 'development') ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error('[API /api/auth/send-otp ❌ Exception]:', error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
