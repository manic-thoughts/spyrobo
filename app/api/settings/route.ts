import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_REQUIRED_FIELDS = [
  'description',
  'assignee',
  'startDate',
  'dueDate',
  'labels',
  'storyPoints',
  'originalEstimate',
  'priority',
  'sprint',
];

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    const userId = match ? match[1] : undefined;

    let targetUserId = userId;

    if (!targetUserId) {
      const demoUser = await prisma.user.findFirst({
        where: { isVerified: true },
      });
      if (demoUser) targetUserId = demoUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ requiredFields: DEFAULT_REQUIRED_FIELDS });
    }

    const pref = await prisma.notificationPreference.findUnique({
      where: { userId: targetUserId },
    });

    return NextResponse.json({
      requiredFields: pref?.requiredFields || DEFAULT_REQUIRED_FIELDS,
      dueSoonDays: pref?.dueSoonDays || 3,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    const userId = match ? match[1] : undefined;

    let targetUserId = userId;

    if (!targetUserId) {
      const demoUser = await prisma.user.findFirst({
        where: { isVerified: true },
      });
      if (demoUser) targetUserId = demoUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const requiredFields = Array.isArray(body.requiredFields) ? body.requiredFields : DEFAULT_REQUIRED_FIELDS;
    const dueSoonDays = typeof body.dueSoonDays === 'number' ? body.dueSoonDays : 3;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: targetUserId },
      update: {
        requiredFields,
        dueSoonDays,
      },
      create: {
        userId: targetUserId,
        requiredFields,
        dueSoonDays,
      },
    });

    return NextResponse.json({ success: true, preference: pref });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
