import { NotificationCandidate, RuleContext } from './types';
import { evaluateOverdue } from './overdue';
import { evaluateDueToday } from './due-today';
import { evaluateDueSoon } from './due-soon';
import { evaluateAssigned } from './assigned';
import { evaluateMissingFields } from './missing-fields';
import { evaluateStatusChange } from './status-change';
import { evaluateCommentActivity } from './comment-activity';

export class RuleEngine {
  /**
   * Evaluates all active rules against a single issue and returns candidate notifications.
   */
  public evaluate(ctx: RuleContext): NotificationCandidate[] {
    const candidates: NotificationCandidate[] = [];

    const overdue = evaluateOverdue(ctx);
    if (overdue) candidates.push(overdue);

    const dueToday = evaluateDueToday(ctx);
    if (dueToday) candidates.push(dueToday);

    const dueSoon = evaluateDueSoon(ctx);
    if (dueSoon) candidates.push(dueSoon);

    const assigned = evaluateAssigned(ctx);
    if (assigned) candidates.push(assigned);

    const missingFields = evaluateMissingFields(ctx);
    if (missingFields) candidates.push(missingFields);

    const statusChange = evaluateStatusChange(ctx);
    if (statusChange) candidates.push(statusChange);

    const commentActivity = evaluateCommentActivity(ctx);
    if (commentActivity) candidates.push(commentActivity);

    return candidates;
  }
}

export const defaultRuleEngine = new RuleEngine();
