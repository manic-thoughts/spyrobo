import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    } catch (dbErr) {
      console.warn('[API/ReadNotification] DB update fallback');
    }

    return NextResponse.json({ success: true, notificationId: id, readAt: new Date() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
