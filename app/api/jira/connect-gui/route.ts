import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserFromRequest } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Please sign in first to connect your Jira account.' }, { status: 401 });
    }

    const body = await request.json();
    const jiraSite = (body.jiraSite || '').trim();
    const jiraEmail = (body.jiraEmail || authUser.email || '').trim().toLowerCase();
    const jiraApiToken = (body.jiraApiToken || '').trim();

    if (!jiraSite) {
      return NextResponse.json(
        { error: 'Jira Site Domain (e.g. https://your-domain.atlassian.net) is required.' },
        { status: 400 }
      );
    }

    const userId = authUser.id;
    const savedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        jiraSite,
        jiraEmail,
        ...(jiraApiToken ? { jiraApiToken } : {}),
      },
    });

    // Run sync for this user to import projects and issues
    try {
      const { syncService } = await import('@/lib/sync/sync-service');
      await syncService.syncUser(undefined, userId);
    } catch (syncErr) {
      console.warn('[ConnectGUI] Auto-sync warning:', syncErr);
    }

    return NextResponse.json({
      success: true,
      message: `Jira credentials configured for ${jiraSite} (${jiraEmail})!`,
      user: savedUser,
    });
  } catch (error: any) {
    console.error('[ConnectGUI Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
