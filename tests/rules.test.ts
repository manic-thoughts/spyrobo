import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../lib/rules/engine';
import { NormalizedJiraIssue } from '../lib/jira/types';

describe('Spyrobo Deterministic Rule Engine', () => {
  const engine = new RuleEngine();
  const userId = 'user-spyrobo-001';
  const jiraAccountId = 'jira-account-001';

  // Fixed test reference date: 2026-09-02
  const refDate = new Date('2026-09-02T10:00:00Z');

  const baseIssue: NormalizedJiraIssue = {
    jiraId: '10001',
    issueKey: 'PROJ-100',
    projectKey: 'PROJ',
    summary: 'Test API Endpoint',
    description: 'Detailed description text.',
    issueType: 'Story',
    status: 'In Progress',
    statusCategory: 'IN_PROGRESS',
    priority: 'High',
    assigneeId: jiraAccountId,
    assigneeName: 'Test User',
    assigneeEmail: 'test@example.com',
    reporterId: jiraAccountId,
    reporterName: 'Test User',
    reporterEmail: 'test@example.com',
    startDate: new Date('2026-08-25'),
    dueDate: new Date('2026-09-01'), // Yesterday -> Overdue
    labels: ['backend'],
    storyPoints: 5,
    sprint: 'Sprint 1',
    originalEstimate: '4h',
    acceptanceCriteria: 'Passes unit tests.',
    jiraUrl: 'https://spyrobo.atlassian.net/browse/PROJ-100',
    updatedAt: new Date('2026-09-01'),
  };

  it('detects OVERDUE for unresolved tickets past due date', () => {
    const results = engine.evaluate({
      issue: baseIssue,
      userId,
      jiraAccountId,
      referenceDate: refDate,
    });

    const overdue = results.find((r) => r.type === 'OVERDUE');
    expect(overdue).toBeDefined();
    expect(overdue?.severity).toBe('HIGH');
    expect(overdue?.eventKey).toBe(`${userId}:10001:OVERDUE:2026-09-01`);
  });

  it('SUPPRESSES OVERDUE for completed (DONE) tickets past due date', () => {
    const doneIssue: NormalizedJiraIssue = {
      ...baseIssue,
      status: 'Done',
      statusCategory: 'DONE',
    };

    const results = engine.evaluate({
      issue: doneIssue,
      userId,
      jiraAccountId,
      referenceDate: refDate,
    });

    const overdue = results.find((r) => r.type === 'OVERDUE');
    expect(overdue).toBeUndefined(); // Must be suppressed!
  });

  it('detects DUE_TODAY when due date matches reference date', () => {
    const dueTodayIssue: NormalizedJiraIssue = {
      ...baseIssue,
      dueDate: new Date('2026-09-02'),
    };

    const results = engine.evaluate({
      issue: dueTodayIssue,
      userId,
      jiraAccountId,
      referenceDate: refDate,
    });

    const dueToday = results.find((r) => r.type === 'DUE_TODAY');
    expect(dueToday).toBeDefined();
    expect(dueToday?.severity).toBe('HIGH');
    expect(dueToday?.eventKey).toBe(`${userId}:10001:DUE_TODAY:2026-09-02`);
  });

  it('detects DUE_SOON when due date is within threshold days', () => {
    const dueSoonIssue: NormalizedJiraIssue = {
      ...baseIssue,
      dueDate: new Date('2026-09-04'), // 2 days in future
    };

    const results = engine.evaluate({
      issue: dueSoonIssue,
      userId,
      jiraAccountId,
      dueSoonDays: 3,
      referenceDate: refDate,
    });

    const dueSoon = results.find((r) => r.type === 'DUE_SOON');
    expect(dueSoon).toBeDefined();
    expect(dueSoon?.severity).toBe('MEDIUM');
  });

  it('GROUPS missing fields into ONE single notification candidate', () => {
    const incompleteIssue: NormalizedJiraIssue = {
      ...baseIssue,
      description: null,
      dueDate: null,
      storyPoints: null,
      labels: [],
    };

    const results = engine.evaluate({
      issue: incompleteIssue,
      userId,
      jiraAccountId,
      referenceDate: refDate,
    });

    const missingNotifications = results.filter((r) => r.type === 'MISSING_FIELDS');
    expect(missingNotifications.length).toBe(1); // Grouped into exactly 1 alert
    expect(missingNotifications[0].message).toContain('Description');
    expect(missingNotifications[0].message).toContain('Due Date');
    expect(missingNotifications[0].message).toContain('Story Points');
    expect(missingNotifications[0].message).toContain('Labels');
  });

  it('generates identical eventKeys for repeated evaluations (Idempotency)', () => {
    const res1 = engine.evaluate({
      issue: baseIssue,
      userId,
      jiraAccountId,
      referenceDate: refDate,
    });

    const res2 = engine.evaluate({
      issue: baseIssue,
      userId,
      jiraAccountId,
      referenceDate: refDate,
    });

    expect(res1.map((r) => r.eventKey)).toEqual(res2.map((r) => r.eventKey));
  });
});
