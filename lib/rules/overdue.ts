import { NotificationCandidate, RuleContext } from './types';

/**
 * OVERDUE Rule:
 * Triggers when an unresolved ticket has a due date before today.
 * MUST suppress overdue alerts for completed (DONE) tickets.
 */
export function evaluateOverdue(ctx: RuleContext): NotificationCandidate | null {
  const { issue, userId, jiraAccountId, userEmails, referenceDate } = ctx;

  const isAssignedToMe =
    issue.assigneeId === jiraAccountId ||
    (userEmails && issue.assigneeEmail && userEmails.includes(issue.assigneeEmail.toLowerCase()));

  const isReportedByMe =
    issue.reporterId === jiraAccountId ||
    (userEmails && issue.reporterEmail && userEmails.includes(issue.reporterEmail.toLowerCase()));

  if (!isAssignedToMe && !isReportedByMe) return null;
  if (!issue.dueDate) return null;
  if (issue.statusCategory === 'DONE') return null; // Suppress completed issues

  const now = referenceDate ? new Date(referenceDate) : new Date();
  
  // Set both dates to 00:00:00 local time to compare calendar dates safely
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(issue.dueDate.getFullYear(), issue.dueDate.getMonth(), issue.dueDate.getDate());

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    const dayStr = diffDays === 1 ? '1 day' : `${diffDays} days`;
    const dateKeyStr = issue.dueDate.toISOString().split('T')[0];

    return {
      type: 'OVERDUE',
      severity: 'HIGH',
      title: `${issue.issueKey} is overdue`,
      message: `${issue.issueKey} (${issue.summary}) is ${dayStr} overdue. Status: ${issue.status}.`,
      eventKey: `${userId}:${issue.jiraId}:OVERDUE:${dateKeyStr}`,
    };
  }

  return null;
}
