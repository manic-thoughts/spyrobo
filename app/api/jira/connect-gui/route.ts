import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jiraSite = (body.jiraSite || '').trim();
    const jiraEmail = (body.jiraEmail || '').trim().toLowerCase();
    const jiraApiToken = (body.jiraApiToken || '').trim();

    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    let userId = match ? match[1] : null;

    let existingUser = null;
    if (userId) {
      existingUser = await prisma.user.findUnique({ where: { id: userId } });
    }

    const effectiveEmail = (body.jiraEmail || existingUser?.email || existingUser?.jiraEmail || '').trim().toLowerCase();

    if (!jiraSite) {
      return NextResponse.json(
        { error: 'Jira Site Domain (e.g. https://your-domain.atlassian.net) is required.' },
        { status: 400 }
      );
    }

    let savedUser;
    if (userId) {
      savedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          jiraSite,
          jiraEmail: effectiveEmail,
          ...(jiraApiToken ? { jiraApiToken } : {}),
        },
      });
    } else {
      // Upsert default/demo user if session cookie not present
      savedUser = await prisma.user.upsert({
        where: { email: effectiveEmail },
        update: {
          jiraSite,
          jiraEmail: effectiveEmail,
          ...(jiraApiToken ? { jiraApiToken } : {}),
        },
        create: {
          email: effectiveEmail,
          displayName: effectiveEmail.split('@')[0],
          jiraSite,
          jiraEmail: effectiveEmail,
          ...(jiraApiToken ? { jiraApiToken } : {}),
        },
      });
      userId = savedUser.id;
    }

    const response = NextResponse.json({
      success: true,
      message: `Jira connection GUI configured for ${jiraSite} (${jiraEmail})!`,
    });

    if (userId) {
      response.cookies.set('spyrobo_session', userId, { path: '/', httpOnly: true });
    }

    return response;
  } catch (error: any) {
    console.error('[ConnectGUI Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
