import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { JiraClient } from '@/lib/jira/client';
import { getAuthUserFromRequest } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ connected: false, projects: [] }, { status: 401 });
    }

    const userId = authUser.id;
    let projects = await prisma.jiraProject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const client = await JiraClient.forUser(userId);
    const isConfigured = client.isConfigured() || Boolean(authUser.jiraSite && authUser.jiraApiToken);

    if (projects.length === 0 && isConfigured) {
      const liveProjects = await client.getProjects();
      if (liveProjects.length > 0) {
        for (const p of liveProjects) {
          try {
            await prisma.jiraProject.upsert({
              where: { userId_projectKey: { userId, projectKey: p.projectKey } },
              update: { name: p.name, jiraSite: p.jiraSite },
              create: { userId, projectKey: p.projectKey, name: p.name, jiraSite: p.jiraSite, isSelected: true },
            });
          } catch (e) {}
        }

        projects = await prisma.jiraProject.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    return NextResponse.json({
      connected: isConfigured,
      projects,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userId = authUser.id;
    const body = await request.json();
    const projectKey = (body.projectKey || '').trim().toUpperCase();
    const name = (body.name || projectKey).trim();
    const jiraSite = body.jiraSite || authUser.jiraSite || '';

    if (!projectKey) {
      return NextResponse.json({ error: 'Project Key is required' }, { status: 400 });
    }

    const newProject = await prisma.jiraProject.upsert({
      where: { userId_projectKey: { userId, projectKey } },
      update: { isSelected: true, name, jiraSite },
      create: { userId, projectKey, name, jiraSite, isSelected: true },
    });

    return NextResponse.json({ success: true, project: newProject });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
