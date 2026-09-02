import { NotificationCandidate, RuleContext } from './types';

/**
 * DUE_TODAY Rule:
 * Triggers when an unresolved ticket is due today.
 */
export function evaluateDueToday(ctx: RuleContext): NotificationCandidate | null {
  const { issue, userId, referenceDate } = ctx;

  if (!issue.dueDate) return null;
  if (issue.statusCategory === 'DONE') return null;

  const now = referenceDate ? new Date(referenceDate) : new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(issue.dueDate.getFullYear(), issue.dueDate.getMonth(), issue.dueDate.getDate());

  if (today.getTime() === due.getTime()) {
    const dateKeyStr = issue.dueDate.toISOString().split('T')[0];

    return {
      type: 'DUE_TODAY',
      severity: 'HIGH',
      title: `${issue.issueKey} is due today`,
      message: `${issue.issueKey} (${issue.summary}) is due today! Status: ${issue.status}.`,
      eventKey: `${userId}:${issue.jiraId}:DUE_TODAY:${dateKeyStr}`,
    };
  }

  return null;
}
