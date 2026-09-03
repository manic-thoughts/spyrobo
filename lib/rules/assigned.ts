import { NotificationCandidate, RuleContext } from './types';

/**
 * ASSIGNED Rule:
 * Triggers when the current user is assigned to an issue.
 */
export function evaluateAssigned(ctx: RuleContext): NotificationCandidate | null {
  const { issue, previousIssue, userId, jiraAccountId, userEmails } = ctx;

  const isAssignedToMe =
    issue.assigneeId === jiraAccountId ||
    (userEmails && issue.assigneeEmail && userEmails.includes(issue.assigneeEmail.toLowerCase()));

  if (!isAssignedToMe) return null;

  return {
    type: 'ASSIGNED',
    severity: 'MEDIUM',
    title: `Assigned to ${issue.issueKey}`,
    message: `You are assigned to ${issue.issueKey} (${issue.summary}).`,
    eventKey: `${userId}:${issue.jiraId}:ASSIGNED:${jiraAccountId}`,
  };
}
