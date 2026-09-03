import { PrismaClient } from '@prisma/client';
import { defaultRuleEngine } from '../lib/rules/engine';
import { JiraClient } from '../lib/jira/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding local PostgreSQL database...');

  const jiraClient = new JiraClient();
  const mockUser = await jiraClient.getCurrentUser();
  const mockIssues = await jiraClient.searchIssues();

  // 1. Create or update user
  const user = await prisma.user.upsert({
    where: { jiraAccountId: mockUser.jiraAccountId },
    update: {
      displayName: mockUser.displayName,
      email: mockUser.email,
      jiraSite: mockUser.jiraSite,
    },
    create: {
      jiraAccountId: mockUser.jiraAccountId,
      displayName: mockUser.displayName,
      email: mockUser.email,
      jiraSite: mockUser.jiraSite,
    },
  });

  // 2. Initialize preferences
  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      dueSoonDays: 3,
    },
  });

  // 3. Upsert Jira issues and generate notifications
  let notificationCount = 0;
  for (const issue of mockIssues) {
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
        assigneeId: issue.assigneeId,
        reporterId: issue.reporterId,
        startDate: issue.startDate,
        dueDate: issue.dueDate,
        labels: issue.labels,
        storyPoints: issue.storyPoints,
        sprint: issue.sprint,
        acceptanceCriteria: issue.acceptanceCriteria,
        jiraUrl: issue.jiraUrl,
        updatedAt: issue.updatedAt,
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
        assigneeId: issue.assigneeId,
        reporterId: issue.reporterId,
        startDate: issue.startDate,
        dueDate: issue.dueDate,
        labels: issue.labels,
        storyPoints: issue.storyPoints,
        sprint: issue.sprint,
        acceptanceCriteria: issue.acceptanceCriteria,
        jiraUrl: issue.jiraUrl,
        updatedAt: issue.updatedAt,
      },
    });

    // Evaluate rules
    const candidates = defaultRuleEngine.evaluate({
      issue,
      userId: user.id,
      jiraAccountId: mockUser.jiraAccountId,
    });

    for (const cand of candidates) {
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            issueId: savedIssue.id,
            type: cand.type as any,
            severity: cand.severity,
            title: cand.title,
            message: cand.message,
            eventKey: cand.eventKey,
          },
        });
        notificationCount++;
      } catch (err: any) {
        // Skip duplicate eventKey
      }
    }
  }

  // 4. Update sync state
  await prisma.syncState.upsert({
    where: { userId: user.id },
    update: {
      lastSyncAt: new Date(),
      lastSuccessAt: new Date(),
      issueCount: mockIssues.length,
    },
    create: {
      userId: user.id,
      lastSyncAt: new Date(),
      lastSuccessAt: new Date(),
      issueCount: mockIssues.length,
    },
  });

  console.log(`Successfully seeded ${mockIssues.length} issues and ${notificationCount} notifications for local user ${user.displayName}!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
