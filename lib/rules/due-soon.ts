import { NotificationCandidate, RuleContext } from './types';

/**
 * DUE_SOON Rule:
 * Triggers when an unresolved ticket is due within N days in the future (default 3 days).
 */
export function evaluateDueSoon(ctx: RuleContext): NotificationCandidate | null {
  const { issue, userId, dueSoonDays = 3, referenceDate } = ctx;

  if (!issue.dueDate) return null;
  if (issue.statusCategory === 'DONE') return null;

  const now = referenceDate ? new Date(referenceDate) : new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(issue.dueDate.getFullYear(), issue.dueDate.getMonth(), issue.dueDate.getDate());

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Must be strictly in the future (diffDays > 0) and within dueSoonDays
  if (diffDays > 0 && diffDays <= dueSoonDays) {
    const dayStr = diffDays === 1 ? '1 day' : `${diffDays} days`;
    const dateKeyStr = issue.dueDate.toISOString().split('T')[0];

    return {
      type: 'DUE_SOON',
      severity: 'MEDIUM',
      title: `${issue.issueKey} is due soon`,
      message: `${issue.issueKey} (${issue.summary}) is due in ${dayStr}. Status: ${issue.status}.`,
      eventKey: `${userId}:${issue.jiraId}:DUE_SOON:${dateKeyStr}`,
    };
  }

  return null;
}
