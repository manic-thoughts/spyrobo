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

  if (previousIssue && previousIssue.status !== issue.status) {
    return {
      type: 'STATUS_CHANGE',
      severity: 'LOW',
      title: `${issue.issueKey} Status Updated to "${issue.status}"`,
      message: `${issue.issueKey} (${issue.summary}) moved from "${previousIssue.status}" to "${issue.status}".`,
      eventKey: `${userId}:${issue.jiraId}:STATUS_CHANGE:${previousIssue.status}->${issue.status}`,
    };
  }

  // If status did NOT change, but activity/comments exist:
  if (issue.statusCategory === 'IN_PROGRESS' || issue.status !== 'To Do') {
    return {
      type: 'COMMENT_ADDED',
      severity: 'LOW',
      title: `${issue.issueKey} New Comment / Activity`,
      message: `New comment/activity logged on ${issue.issueKey} (${issue.summary}).`,
      eventKey: `${userId}:${issue.jiraId}:COMMENT_ADDED:activity`,
    };
  }

  return null;
}
