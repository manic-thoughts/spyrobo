import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { JiraClient } from '@/lib/jira/client';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    const userId = match ? match[1] : undefined;

    let projects: any[] = [];

    if (userId) {
      projects = await prisma.jiraProject.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (projects.length === 0) {
      const client = await JiraClient.forUser(userId);
      const liveProjects = await client.getProjects();
      if (liveProjects.length > 0) {
        projects = liveProjects;
      }
    }

    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectKey = (body.projectKey || '').trim().toUpperCase();
    const name = (body.name || projectKey).trim();

    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    const userId = match ? match[1] : null;

    let user: any = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    const jiraSite = body.jiraSite || user?.jiraSite || '';

    if (!projectKey) {
      return NextResponse.json({ error: 'Project Key is required' }, { status: 400 });
    }

    if (!userId) {
      // Find or create default demo user
      const demoUser = await prisma.user.upsert({
        where: { email: 'user@spyrobo.app' },
        update: {},
        create: { email: 'user@spyrobo.app', displayName: 'Demo User', isVerified: true },
      });

      const newProject = await prisma.jiraProject.upsert({
        where: { userId_projectKey: { userId: demoUser.id, projectKey } },
        update: { isSelected: true, name },
        create: { userId: demoUser.id, projectKey, name, jiraSite, isSelected: true },
      });

      return NextResponse.json({ success: true, project: newProject });
    }

    const newProject = await prisma.jiraProject.upsert({
      where: { userId_projectKey: { userId, projectKey } },
      update: { isSelected: true, name },
      create: { userId, projectKey, name, jiraSite, isSelected: true },
    });

    return NextResponse.json({ success: true, project: newProject });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
