import { NotificationCandidate, RuleContext } from './types';

/**
 * STATUS_CHANGE Rule:
 * Triggers status updates and activity notifications for cards assigned to or reported by the user.
 */
export function evaluateStatusChange(ctx: RuleContext): NotificationCandidate | null {
  const { issue, previousIssue, userId, jiraAccountId, userEmails } = ctx;

  const isAssignedToMe =
    issue.assigneeId === jiraAccountId ||
    (userEmails && issue.assigneeEmail && userEmails.includes(issue.assigneeEmail.toLowerCase()));

  const isReportedByMe =
    issue.reporterId === jiraAccountId ||
    (userEmails && issue.reporterEmail && userEmails.includes(issue.reporterEmail.toLowerCase()));

  if (!isAssignedToMe && !isReportedByMe) return null;

  // 1. Explicit status transition from previous issue state
  if (previousIssue && previousIssue.status !== issue.status) {
    return {
      type: 'STATUS_CHANGE',
      severity: 'LOW',
      title: `${issue.issueKey} Status Changed to "${issue.status}"`,
      message: `${issue.issueKey} (${issue.summary}) moved from "${previousIssue.status}" to "${issue.status}".`,
      eventKey: `${userId}:${issue.jiraId}:STATUS_CHANGE:${previousIssue.status}->${issue.status}`,
    };
  }

  // 2. Status candidate for active status items (Done, In Progress, In Review, etc.)
  if (issue.status && issue.status !== 'To Do') {
    return {
      type: 'STATUS_CHANGE',
      severity: 'LOW',
      title: `${issue.issueKey} Status: ${issue.status}`,
      message: `${issue.issueKey} (${issue.summary}) current status is "${issue.status}".`,
      eventKey: `${userId}:${issue.jiraId}:STATUS_CHANGE:${issue.status}`,
    };
  }

  return null;
}
