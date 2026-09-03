import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { JiraClient } from '@/lib/jira/client';
import { defaultRuleEngine } from '@/lib/rules/engine';
import { getAuthUserFromRequest } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectKey = searchParams.get('projectKey')?.toUpperCase();

    const dbUser = await getAuthUserFromRequest(request);
    const userId = dbUser?.id;

    const client = await JiraClient.forUser(userId);
    const currentUser = await client.getCurrentUser();

    let issues: any[] = [];
    let notifications: any[] = [];
    let syncState: any = null;

    const userEmails: string[] = [
      currentUser.email?.toLowerCase(),
      dbUser?.jiraEmail?.toLowerCase(),
      dbUser?.email?.toLowerCase(),
    ].filter((e): e is string => Boolean(e));

    try {
      const userRecord: any = dbUser || (await prisma.user.findUnique({
        where: { jiraAccountId: currentUser.jiraAccountId },
        include: { syncState: true },
      }));

      if (userRecord) {
        issues = await prisma.jiraIssue.findMany({
          where: projectKey && projectKey !== 'ALL' ? { projectKey } : undefined,
          orderBy: { updatedAt: 'desc' },
        });
        syncState = userRecord.syncState;
      }
    } catch (dbErr: any) {
      console.warn('[API/Summary] DB access fallback to live Jira client evaluation:', dbErr.message);
    }

    if (issues.length === 0) {
      const searchJql = projectKey && projectKey !== 'ALL' ? `project = "${projectKey}" ORDER BY updated DESC` : 'created >= -365d ORDER BY updated DESC';
      const normalized = await client.searchIssues(searchJql);
      const filteredNormalized = projectKey && projectKey !== 'ALL'
        ? normalized.filter((i) => i.projectKey.toUpperCase() === projectKey)
        : normalized;

      issues = filteredNormalized.filter((issue) => {
        const isAssigned =
          issue.assigneeId === currentUser.jiraAccountId ||
          (issue.assigneeEmail && userEmails.includes(issue.assigneeEmail.toLowerCase()));
        const isReported =
          issue.reporterId === currentUser.jiraAccountId ||
          (issue.reporterEmail && userEmails.includes(issue.reporterEmail.toLowerCase()));
        return isAssigned || isReported;
      });
    }

    const pref = dbUser ? await prisma.notificationPreference.findUnique({ where: { userId: dbUser.id } }) : null;
    const requiredFields = pref?.requiredFields;

    // Evaluate live notifications dynamically for all issues
    const liveNotifications: any[] = [];
    issues.forEach((issue) => {
      const cands = defaultRuleEngine.evaluate({
        issue,
        userId: dbUser?.id || 'user-id',
        jiraAccountId: currentUser.jiraAccountId,
        userEmails,
        requiredFields,
      });

      cands.forEach((c, idx) => {
        liveNotifications.push({
          id: `live-${issue.jiraId || issue.issueKey}-${c.type}-${idx}`,
          type: c.type,
          severity: c.severity,
          title: c.title,
          message: c.message,
          eventKey: c.eventKey,
          readAt: null,
          createdAt: new Date(),
          issue,
        });
      });
    });

    notifications = liveNotifications;

    const isAssigned = (n: any) =>
      n.issue?.assigneeId === currentUser.jiraAccountId ||
      (n.issue?.assigneeEmail && userEmails.includes(n.issue.assigneeEmail.toLowerCase()));

    const isReported = (n: any) =>
      n.issue?.reporterId === currentUser.jiraAccountId ||
      (n.issue?.reporterEmail && userEmails.includes(n.issue.reporterEmail.toLowerCase()));

    // Count metrics with Assigned vs Reported breakdown
    const assignedOverdueCount = notifications.filter((n) => n.type === 'OVERDUE' && isAssigned(n)).length;
    const reportedOverdueCount = notifications.filter((n) => n.type === 'OVERDUE' && isReported(n)).length;

    const assignedRemindersCount = notifications.filter((n) => (n.type === 'DUE_SOON' || n.type === 'DUE_TODAY') && isAssigned(n)).length;
    const reportedRemindersCount = notifications.filter((n) => (n.type === 'DUE_SOON' || n.type === 'DUE_TODAY') && isReported(n)).length;

    const dueRemindersCount = notifications.filter((n) => n.type === 'DUE_SOON' || n.type === 'DUE_TODAY').length;
    const missingFieldsCount = notifications.filter((n) => n.type === 'MISSING_FIELDS').length;
    const assignmentCount = notifications.filter((n) => n.type === 'ASSIGNED').length;
    const unreadCount = notifications.filter((n) => !n.readAt).length;

    // Prioritize top attention items
    const topAttentionItems = notifications
      .filter((n) => n.type === 'OVERDUE' || n.type === 'DUE_TODAY' || n.type === 'MISSING_FIELDS' || n.type === 'DUE_SOON')
      .slice(0, 8);

    return NextResponse.json({
      user: currentUser,
      projectKey: projectKey || 'ALL',
      isMockMode: client.isMockMode(),
      metrics: {
        overdueCount: assignedOverdueCount + reportedOverdueCount,
        assignedOverdueCount,
        reportedOverdueCount,
        dueRemindersCount,
        assignedRemindersCount,
        reportedRemindersCount,
        missingFieldsCount,
        assignmentCount,
        unreadCount,
        totalAttentionCount: notifications.length,
      },
      topAttentionItems,
      allNotifications: notifications,
      recentActivity: notifications.slice(0, 10),
      lastSyncAt: syncState?.lastSyncAt || new Date(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
