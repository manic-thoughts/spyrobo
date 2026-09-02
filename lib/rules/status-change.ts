import { NotificationCandidate, RuleContext } from './types';

/**
 * STATUS_CHANGE Rule:
 * Triggers when an issue changes status category or status name.
 */
export function evaluateStatusChange(ctx: RuleContext): NotificationCandidate | null {
  const { issue, previousIssue, userId } = ctx;

  if (!previousIssue) return null;

  if (previousIssue.status !== issue.status) {
    return {
      type: 'STATUS_CHANGE',
      severity: 'LOW',
      title: `${issue.issueKey} status updated`,
      message: `${issue.issueKey} moved from "${previousIssue.status}" to "${issue.status}".`,
      eventKey: `${userId}:${issue.jiraId}:STATUS_CHANGE:${previousIssue.status}->${issue.status}`,
    };
  }

  return null;
}
