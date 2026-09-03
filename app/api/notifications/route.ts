import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { JiraClient } from '@/lib/jira/client';
import { defaultRuleEngine } from '@/lib/rules/engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const projectKey = searchParams.get('projectKey')?.toUpperCase();

    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    const userId = match ? match[1] : undefined;

    const client = await JiraClient.forUser(userId);
    const currentUser = await client.getCurrentUser();

    let dbUser: any = null;
    if (userId) {
      try {
        dbUser = await prisma.user.findUnique({ where: { id: userId }, include: { preferences: true } });
      } catch (e) {}
    }
    if (!dbUser && currentUser.email) {
      try {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: currentUser.email.toLowerCase() },
              { jiraEmail: currentUser.email.toLowerCase() },
            ],
          },
          include: { preferences: true },
        });
      } catch (e) {}
    }
    if (!dbUser) {
      try {
        dbUser = await prisma.user.findFirst({
          where: { jiraSite: { not: null } },
          include: { preferences: true },
        });
      } catch (e) {}
    }

    const userEmails = [
      currentUser.email?.toLowerCase(),
      dbUser?.jiraEmail?.toLowerCase(),
      dbUser?.email?.toLowerCase(),
    ].filter(Boolean);

    let userRecord: any = dbUser;
    let notifications: any[] = [];

    try {
      if (!userRecord && currentUser.jiraAccountId) {
        userRecord = await prisma.user.findUnique({
          where: { jiraAccountId: currentUser.jiraAccountId },
          include: { preferences: true },
        });
      }

      if (!userRecord && currentUser.email) {
        userRecord = await prisma.user.findFirst({
          where: {
            OR: [
              { email: currentUser.email.toLowerCase() },
              { jiraEmail: currentUser.email.toLowerCase() },
            ],
          },
          include: { preferences: true },
        });
      }

      if (userRecord) {
        notifications = await prisma.notification.findMany({
          where: {
            userId: userRecord.id,
            ...(typeFilter && typeFilter !== 'ALL'
              ? typeFilter === 'STATUS_AND_COMMENTS'
                ? { type: { in: ['STATUS_CHANGE', 'COMMENT_ADDED'] as any } }
                : typeFilter === 'DUE_SOON' || typeFilter === 'ASSIGNED_DUE' || typeFilter === 'REPORTED_DUE'
                ? { type: { in: ['DUE_SOON', 'DUE_TODAY'] as any } }
                : typeFilter === 'ASSIGNED_OVERDUE' || typeFilter === 'REPORTED_OVERDUE'
                ? { type: 'OVERDUE' as any }
                : { type: typeFilter as any }
              : {}),
            ...(unreadOnly ? { readAt: null } : {}),
            ...(projectKey && projectKey !== 'ALL' ? { issue: { projectKey } } : {}),
          },
          include: { issue: true },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch (dbErr) {
      console.warn('[API/Notifications] DB query fallback');
    }

    if (notifications.length === 0) {
      const searchJql = projectKey && projectKey !== 'ALL' ? `project = "${projectKey}" ORDER BY updated DESC` : 'created >= -365d ORDER BY updated DESC';
      const normalized = await client.searchIssues(searchJql);
      
      const filteredNormalized = projectKey && projectKey !== 'ALL'
        ? normalized.filter((i) => i.projectKey.toUpperCase() === projectKey)
        : normalized;

      const userIssues = filteredNormalized.filter((issue) => {
        const isAssigned =
          issue.assigneeId === currentUser.jiraAccountId ||
          (issue.assigneeEmail && userEmails.includes(issue.assigneeEmail.toLowerCase()));
        const isReported =
          issue.reporterId === currentUser.jiraAccountId ||
          (issue.reporterEmail && userEmails.includes(issue.reporterEmail.toLowerCase()));
        return isAssigned || isReported;
      });

      const pref = userRecord ? await prisma.notificationPreference.findUnique({ where: { userId: userRecord.id } }) : null;
      const requiredFields = pref?.requiredFields;
      const inMem: any[] = [];

      userIssues.forEach((issue) => {
        const cands = defaultRuleEngine.evaluate({
          issue,
          userId: userId || 'user-id',
          jiraAccountId: currentUser.jiraAccountId,
          userEmails,
          requiredFields,
        });

        cands.forEach((c, idx) => {
          if (typeFilter && typeFilter !== 'ALL') {
            if (typeFilter === 'STATUS_AND_COMMENTS') {
              if (c.type !== 'STATUS_CHANGE' && c.type !== 'COMMENT_ADDED') return;
            } else if (typeFilter === 'DUE_SOON' || typeFilter === 'ASSIGNED_DUE' || typeFilter === 'REPORTED_DUE') {
              if (c.type !== 'DUE_SOON' && c.type !== 'DUE_TODAY') return;
            } else if (typeFilter === 'ASSIGNED_OVERDUE' || typeFilter === 'REPORTED_OVERDUE') {
              if (c.type !== 'OVERDUE') return;
            } else if (c.type !== typeFilter) {
              return;
            }
          }

          inMem.push({
            id: `inmem-${issue.jiraId}-${c.type}-${idx}`,
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

      notifications = inMem;
    }

    const targetUser = dbUser || userRecord;
    const pref: any = targetUser?.preferences || (targetUser ? await prisma.notificationPreference.findUnique({ where: { userId: targetUser.id } }) : null);
    let lastReadAllAt: any = pref?.lastReadAllAt;
    if (!lastReadAllAt && targetUser?.id) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe('SELECT "lastReadAllAt" FROM "NotificationPreference" WHERE "userId" = $1', targetUser.id);
        if (rows?.[0]?.lastReadAllAt) lastReadAllAt = rows[0].lastReadAllAt;
      } catch (e) {}
    }
    if (!lastReadAllAt) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe('SELECT "lastReadAllAt" FROM "NotificationPreference" WHERE "lastReadAllAt" IS NOT NULL ORDER BY "lastReadAllAt" DESC LIMIT 1');
        if (rows?.[0]?.lastReadAllAt) lastReadAllAt = rows[0].lastReadAllAt;
      } catch (e) {}
    }
    const requiredFields = pref?.requiredFields;

    const seenEventKeys = new Set<string>();
    const uniqueNotifications = notifications.filter((n) => {
      const key = `${n.issue?.jiraId || n.issueId}:${n.type}:${n.title}`;
      if (seenEventKeys.has(key)) return false;
      seenEventKeys.add(key);
      return true;
    });

    const mappedNotifications = uniqueNotifications.map((n) => {
      const isRead = Boolean(n.readAt || lastReadAllAt);
      return {
        ...n,
        readAt: isRead ? (n.readAt || lastReadAllAt) : null,
      };
    });

    const isAssigned = (n: any) =>
      n.issue?.assigneeId === currentUser.jiraAccountId ||
      (n.issue?.assigneeEmail && userEmails.includes(n.issue.assigneeEmail.toLowerCase()));

    const isReported = (n: any) =>
      n.issue?.reporterId === currentUser.jiraAccountId ||
      (n.issue?.reporterEmail && userEmails.includes(n.issue.reporterEmail.toLowerCase()));

    const filteredNotifications = mappedNotifications.filter((n) => {
      if (unreadOnly && n.readAt) return false;
      if (!typeFilter || typeFilter === 'ALL') return true;

      if (typeFilter === 'STATUS_AND_COMMENTS') {
        return n.type === 'STATUS_CHANGE' || n.type === 'COMMENT_ADDED';
      }
      if (typeFilter === 'ASSIGNED_OVERDUE') {
        return n.type === 'OVERDUE' && isAssigned(n);
      }
      if (typeFilter === 'REPORTED_OVERDUE') {
        return n.type === 'OVERDUE' && isReported(n);
      }
      if (typeFilter === 'ASSIGNED_DUE') {
        return (n.type === 'DUE_SOON' || n.type === 'DUE_TODAY') && isAssigned(n);
      }
      if (typeFilter === 'REPORTED_DUE') {
        return (n.type === 'DUE_SOON' || n.type === 'DUE_TODAY') && isReported(n);
      }
      if (typeFilter === 'DUE_SOON') {
        return n.type === 'DUE_SOON' || n.type === 'DUE_TODAY';
      }
      return n.type === typeFilter;
    });

    return NextResponse.json({
      projectKey: projectKey || 'ALL',
      totalCount: filteredNotifications.length,
      unreadCount: filteredNotifications.filter((n) => !n.readAt).length,
      notifications: filteredNotifications,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
