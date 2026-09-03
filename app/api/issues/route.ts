import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { JiraClient } from '@/lib/jira/client';
import { isStoryMissingFields } from '@/lib/rules/missing-fields';
import { getAuthUserFromRequest } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const projectKey = searchParams.get('projectKey')?.toUpperCase();

    const authUser = await getAuthUserFromRequest(request);
    const userId = authUser?.id;

    const client = await JiraClient.forUser(userId);
    const currentUser = await client.getCurrentUser();

    let issues: any[] = [];
    let requiredFields: string[] | undefined = undefined;

    try {
      const dbUser = await prisma.user.findUnique({
        where: { jiraAccountId: currentUser.jiraAccountId },
        include: { preferences: true },
      });

      if (dbUser?.preferences?.requiredFields) {
        requiredFields = dbUser.preferences.requiredFields;
      }
    } catch (e) {}

    try {
      issues = await prisma.jiraIssue.findMany({
        where: projectKey ? { projectKey } : undefined,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (dbErr) {
      console.warn('[API/Issues] DB query fallback');
    }

    if (issues.length === 0) {
      const searchJql = projectKey && projectKey !== 'ALL' ? `project = "${projectKey}" ORDER BY updated DESC` : 'created >= -365d ORDER BY updated DESC';
      const normalized = await client.searchIssues(searchJql);
      issues = projectKey && projectKey !== 'ALL' ? normalized.filter((i) => i.projectKey.toUpperCase() === projectKey) : normalized;
    }

    let dbUser: any = null;
    if (userId) {
      try {
        dbUser = await prisma.user.findUnique({ where: { id: userId } });
      } catch (e) {
        // ignore
      }
    }

    const userEmails = [
      currentUser.email?.toLowerCase(),
      dbUser?.jiraEmail?.toLowerCase(),
      dbUser?.email?.toLowerCase(),
    ].filter(Boolean);

    const today = new Date();
    const filtered = issues.filter((issue) => {
      const isAssignedToUser =
        issue.assigneeId === currentUser.jiraAccountId ||
        (issue.assigneeEmail && userEmails.includes(issue.assigneeEmail.toLowerCase()));

      const isReportedByUser =
        issue.reporterId === currentUser.jiraAccountId ||
        (issue.reporterEmail && userEmails.includes(issue.reporterEmail.toLowerCase()));

      const belongsToUser = isAssignedToUser || isReportedByUser;

      // STRICTLY ENFORCE: Only return cards assigned to or reported by current user!
      if (!belongsToUser) return false;

      if (filter === 'assigned') {
        return isAssignedToUser;
      }
      if (filter === 'reported') {
        return isReportedByUser;
      }
      if (filter === 'overdue') {
        if (!issue.dueDate) return false;
        if (issue.statusCategory === 'DONE') return false;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const d = new Date(issue.dueDate);
        const dueCalendarDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        return dueCalendarDate < startOfToday;
      }
      if (filter === 'incomplete') {
        if (!isReportedByUser) return false;
        return isStoryMissingFields(issue, requiredFields);
      }
      return true;
    });

    return NextResponse.json({
      filter,
      projectKey: projectKey || 'ALL',
      totalCount: filtered.length,
      issues: filtered,
      requiredFields,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
