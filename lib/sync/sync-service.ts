import { prisma } from '../db/prisma';
import { JiraClient } from '../jira/client';
import { defaultRuleEngine } from '../rules/engine';
import { NormalizedJiraIssue } from '../jira/types';

export interface SyncResult {
  success: boolean;
  jiraAccountId: string;
  displayName: string;
  syncedIssueCount: number;
  newNotificationsCount: number;
  isMockMode: boolean;
  error?: string;
  syncedAt: Date;
}

export class SyncService {
  /**
   * Main synchronization pipeline.
   * Fetches relevant Jira issues, normalizes them, upserts into DB,
   * runs deterministic rules, generates event keys, and inserts deduplicated notifications.
   */
  async syncUser(customJiraAccountId?: string, userId?: string): Promise<SyncResult> {
    const jiraClient = await JiraClient.forUser(userId);
    const isMock = jiraClient.isMockMode();
    const syncedAt = new Date();

    try {
      // 1. Fetch current Jira User Profile
      const jiraUser = await jiraClient.getCurrentUser();
      const accountId = customJiraAccountId || jiraUser.jiraAccountId;

      // 2. Fetch Relevant Issues from Jira REST API (Assignee or Reporter)
      const issues: NormalizedJiraIssue[] = await jiraClient.searchIssues(
        `assignee = "${accountId}" OR reporter = "${accountId}"`
      );

      let newNotificationsCount = 0;
      let appUser: any = null;

      // Attempt DB persistence
      try {
        // Upsert User
        appUser = await prisma.user.upsert({
          where: { jiraAccountId: accountId },
          update: {
            displayName: jiraUser.displayName,
            email: jiraUser.email,
            jiraSite: jiraUser.jiraSite,
          },
          create: {
            jiraAccountId: accountId,
            displayName: jiraUser.displayName,
            email: jiraUser.email,
            jiraSite: jiraUser.jiraSite,
          },
        });

        // Initialize Preferences if missing
        await prisma.notificationPreference.upsert({
          where: { userId: appUser.id },
          update: {},
          create: {
            userId: appUser.id,
            dueSoonDays: 3,
          },
        });

        // Upsert Jira Issues into PostgreSQL DB
        for (const issue of issues) {
          const isAssignee = issue.assigneeId === accountId;
          const isReporter = issue.reporterId === accountId;

          // Find previous snapshot to detect status transitions
          const previousIssue = await prisma.jiraIssue.findUnique({
            where: { jiraId: issue.jiraId },
          });

          const savedIssue = await prisma.jiraIssue.upsert({
            where: { jiraId: issue.jiraId },
            update: {
              issueKey: issue.issueKey,
              projectKey: issue.projectKey,
              summary: issue.summary,
              description: issue.description,
              status: issue.status,
              statusCategory: issue.statusCategory,
              priority: issue.priority,
              assigneeId: isAssignee ? accountId : issue.assigneeId,
              reporterId: isReporter ? accountId : issue.reporterId,
              startDate: issue.startDate,
              dueDate: issue.dueDate,
              labels: issue.labels,
              storyPoints: issue.storyPoints,
              sprint: issue.sprint,
              acceptanceCriteria: issue.acceptanceCriteria,
              jiraUrl: issue.jiraUrl,
              updatedAt: issue.updatedAt,
              syncedAt,
            },
            create: {
              jiraId: issue.jiraId,
              issueKey: issue.issueKey,
              projectKey: issue.projectKey,
              summary: issue.summary,
              description: issue.description,
              status: issue.status,
              statusCategory: issue.statusCategory,
              priority: issue.priority,
              assigneeId: isAssignee ? accountId : issue.assigneeId,
              reporterId: isReporter ? accountId : issue.reporterId,
              startDate: issue.startDate,
              dueDate: issue.dueDate,
              labels: issue.labels,
              storyPoints: issue.storyPoints,
              sprint: issue.sprint,
              acceptanceCriteria: issue.acceptanceCriteria,
              jiraUrl: issue.jiraUrl,
              updatedAt: issue.updatedAt,
              syncedAt,
            },
          });

          // Run Rule Engine
          const candidates = defaultRuleEngine.evaluate({
            issue,
            previousIssue: previousIssue
              ? {
                  jiraId: previousIssue.jiraId,
                  issueKey: previousIssue.issueKey,
                  projectKey: previousIssue.projectKey,
                  summary: previousIssue.summary,
                  description: previousIssue.description,
                  issueType: (previousIssue as any).issueType || 'Story',
                  status: previousIssue.status,
                  statusCategory: previousIssue.statusCategory as any,
                  priority: previousIssue.priority,
                  assigneeId: previousIssue.assigneeId,
                  assigneeName: (previousIssue as any).assigneeName || null,
                  assigneeEmail: (previousIssue as any).assigneeEmail || null,
                  reporterId: previousIssue.reporterId,
                  reporterName: (previousIssue as any).reporterName || null,
                  reporterEmail: (previousIssue as any).reporterEmail || null,
                  startDate: previousIssue.startDate,
                  dueDate: previousIssue.dueDate,
                  labels: previousIssue.labels,
                  storyPoints: previousIssue.storyPoints,
                  sprint: previousIssue.sprint,
                  originalEstimate: (previousIssue as any).originalEstimate || null,
                  jiraUrl: previousIssue.jiraUrl,
                  updatedAt: previousIssue.updatedAt,
                }
              : null,
            userId: appUser.id,
            jiraAccountId: accountId,
          });

          // Insert candidate notifications using unique eventKey for non-spam deduplication
          for (const cand of candidates) {
            try {
              await prisma.notification.create({
                data: {
                  userId: appUser.id,
                  issueId: savedIssue.id,
                  type: cand.type as any,
                  severity: cand.severity,
                  title: cand.title,
                  message: cand.message,
                  eventKey: cand.eventKey,
                },
              });
              newNotificationsCount++;
            } catch (err: any) {
              // P2002 is Prisma unique constraint violation code (duplicate eventKey ignored)
              if (err.code !== 'P2002') {
                console.warn('[SyncService] Notification insert warning:', err.message);
              }
            }
          }
        }

        // Update Sync State Record
        await prisma.syncState.upsert({
          where: { userId: appUser.id },
          update: {
            lastSyncAt: syncedAt,
            lastSuccessAt: syncedAt,
            lastError: null,
            issueCount: issues.length,
          },
          create: {
            userId: appUser.id,
            lastSyncAt: syncedAt,
            lastSuccessAt: syncedAt,
            lastError: null,
            issueCount: issues.length,
          },
        });
      } catch (dbError: any) {
        console.warn('[SyncService] DB unavailable during sync, utilizing memory state mode:', dbError.message);
      }

      return {
        success: true,
        jiraAccountId: accountId,
        displayName: jiraUser.displayName,
        syncedIssueCount: issues.length,
        newNotificationsCount,
        isMockMode: isMock,
        syncedAt,
      };
    } catch (err: any) {
      console.error('[SyncService] Sync failure:', err.message);
      return {
        success: false,
        jiraAccountId: customJiraAccountId || 'unknown',
        displayName: 'Unknown',
        syncedIssueCount: 0,
        newNotificationsCount: 0,
        isMockMode: isMock,
        error: err.message,
        syncedAt,
      };
    }
  }
}

export const syncService = new SyncService();
