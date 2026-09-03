import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { JiraClient } from '@/lib/jira/client';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    const userId = match ? match[1] : undefined;

    const client = await JiraClient.forUser(userId);
    const currentUser = await client.getCurrentUser();

    try {
      const now = new Date();
      await Promise.all([
        prisma.notification.updateMany({
          where: { readAt: null },
          data: { readAt: now },
        }),
        prisma.$executeRawUnsafe('UPDATE "NotificationPreference" SET "lastReadAllAt" = NOW()'),
      ]);
    } catch (dbErr) {
      console.warn('[API/ReadAllNotifications] DB batch update fallback');
    }

    return NextResponse.json({ success: true, markedAt: new Date() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
