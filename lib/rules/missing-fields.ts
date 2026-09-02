import { NotificationCandidate, RuleContext } from './types';

const DEFAULT_REQUIRED_FIELDS = [
  'description',
  'assignee',
  'startDate',
  'dueDate',
  'labels',
  'storyPoints',
  'priority',
  'sprint',
  'acceptanceCriteria',
];

const FIELD_DISPLAY_NAMES: Record<string, string> = {
  description: 'Description',
  assignee: 'Assignee',
  startDate: 'Start Date',
  dueDate: 'Due Date',
  labels: 'Labels',
  storyPoints: 'Story Points',
  priority: 'Priority',
  sprint: 'Sprint',
  acceptanceCriteria: 'Acceptance Criteria',
};

/**
 * MISSING_FIELDS Rule:
 * Evaluates required fields policy. Groups all missing fields into ONE single notification per issue.
 */
export function evaluateMissingFields(ctx: RuleContext): NotificationCandidate | null {
  const { issue, userId, requiredFields = DEFAULT_REQUIRED_FIELDS } = ctx;

  const missing: string[] = [];

  for (const field of requiredFields) {
    switch (field) {
      case 'description':
        if (!issue.description) missing.push(FIELD_DISPLAY_NAMES.description);
        break;
      case 'assignee':
        if (!issue.assigneeId) missing.push(FIELD_DISPLAY_NAMES.assignee);
        break;
      case 'startDate':
        if (!issue.startDate) missing.push(FIELD_DISPLAY_NAMES.startDate);
        break;
      case 'dueDate':
        if (!issue.dueDate) missing.push(FIELD_DISPLAY_NAMES.dueDate);
        break;
      case 'labels':
        if (!issue.labels || issue.labels.length === 0) missing.push(FIELD_DISPLAY_NAMES.labels);
        break;
      case 'storyPoints':
        if (issue.storyPoints === null || issue.storyPoints === undefined) missing.push(FIELD_DISPLAY_NAMES.storyPoints);
        break;
      case 'priority':
        if (!issue.priority) missing.push(FIELD_DISPLAY_NAMES.priority);
        break;
      case 'sprint':
        if (!issue.sprint) missing.push(FIELD_DISPLAY_NAMES.sprint);
        break;
      case 'acceptanceCriteria':
        if (!issue.acceptanceCriteria) missing.push(FIELD_DISPLAY_NAMES.acceptanceCriteria);
        break;
    }
  }

  if (missing.length > 0) {
    const missingStr = missing.join(', ');
    const hash = missing.sort().join('|');

    return {
      type: 'MISSING_FIELDS',
      severity: 'MEDIUM',
      title: `${issue.issueKey} missing required fields`,
      message: `${issue.issueKey} (${issue.summary}) is missing: ${missingStr}.`,
      eventKey: `${userId}:${issue.jiraId}:MISSING_FIELDS:${hash}`,
    };
  }

  return null;
}
