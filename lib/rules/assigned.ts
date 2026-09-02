import { NotificationCandidate, RuleContext } from './types';

/**
 * ASSIGNED Rule:
 * Triggers when the current user is assigned to an issue.
 */
export function evaluateAssigned(ctx: RuleContext): NotificationCandidate | null {
  const { issue, previousIssue, userId, jiraAccountId } = ctx;

  // Check if assigned to current user
  if (issue.assigneeId !== jiraAccountId) return null;

  // If previous issue state exists, only trigger if assignee changed to current user
  if (previousIssue && previousIssue.assigneeId === jiraAccountId) {
    return null;
  }

  return {
    type: 'ASSIGNED',
    severity: 'MEDIUM',
    title: `Assigned to ${issue.issueKey}`,
    message: `You have been assigned to ${issue.issueKey} (${issue.summary}). Status: ${issue.status}.`,
    eventKey: `${userId}:${issue.jiraId}:ASSIGNED:${jiraAccountId}`,
  };
}
