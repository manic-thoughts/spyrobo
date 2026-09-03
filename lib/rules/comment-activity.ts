import { NotificationCandidate, RuleContext } from './types';

/**
 * COMMENT_ADDED Rule:
 * Triggers activity/comment notifications for cards assigned to or reported by the user.
 */
export function evaluateCommentActivity(ctx: RuleContext): NotificationCandidate | null {
  const { issue, userId, jiraAccountId, userEmails } = ctx;

  const isAssignedToMe =
    issue.assigneeId === jiraAccountId ||
    (userEmails && issue.assigneeEmail && userEmails.includes(issue.assigneeEmail.toLowerCase()));

  const isReportedByMe =
    issue.reporterId === jiraAccountId ||
    (userEmails && issue.reporterEmail && userEmails.includes(issue.reporterEmail.toLowerCase()));

  if (!isAssignedToMe && !isReportedByMe) return null;

  // Generate comment/activity candidate if issue has description/activity
  if (issue.description || issue.statusCategory === 'IN_PROGRESS') {
    return {
      type: 'COMMENT_ADDED',
      severity: 'LOW',
      title: `${issue.issueKey} Comment / Activity Logged`,
      message: `New activity or comment logged on ${issue.issueKey} (${issue.summary}).`,
      eventKey: `${userId}:${issue.jiraId}:COMMENT_ADDED:${issue.updatedAt ? new Date(issue.updatedAt).getTime() : 'act'}`,
    };
  }

  return null;
}
