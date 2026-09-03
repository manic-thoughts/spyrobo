import { NotificationCandidate, RuleContext } from './types';

export const DEFAULT_REQUIRED_FIELDS = [
  'description',
  'assignee',
  'dueDate',
  'storyPoints',
  'originalEstimate',
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
  originalEstimate: 'Original Estimate',
};

export function getStoryMissingFieldNames(issue: any, requiredFields: string[] = DEFAULT_REQUIRED_FIELDS): string[] {
  const isStory = issue?.issueType ? String(issue.issueType).toLowerCase().includes('story') : true;
  if (!isStory) return [];

  const missing: string[] = [];

  for (const field of requiredFields) {
    switch (field) {
      case 'description':
        if (!issue.description) missing.push(FIELD_DISPLAY_NAMES.description || 'Description');
        break;
      case 'assignee':
        if (!issue.assigneeId) missing.push(FIELD_DISPLAY_NAMES.assignee || 'Assignee');
        break;
      case 'startDate':
        if (!issue.startDate) missing.push(FIELD_DISPLAY_NAMES.startDate || 'Start Date');
        break;
      case 'dueDate':
        if (!issue.dueDate) missing.push(FIELD_DISPLAY_NAMES.dueDate || 'Due Date');
        break;
      case 'labels':
        if (!issue.labels || issue.labels.length === 0) missing.push(FIELD_DISPLAY_NAMES.labels || 'Labels');
        break;
      case 'storyPoints':
        if (issue.storyPoints === null || issue.storyPoints === undefined) missing.push(FIELD_DISPLAY_NAMES.storyPoints || 'Story Points');
        break;
      case 'priority':
        if (!issue.priority) missing.push(FIELD_DISPLAY_NAMES.priority || 'Priority');
        break;
      case 'sprint':
        if (!issue.sprint) missing.push(FIELD_DISPLAY_NAMES.sprint || 'Sprint');
        break;
      case 'originalEstimate': {
        const est = issue.originalEstimate;
        const estStr = est !== null && est !== undefined ? String(est).trim().toLowerCase() : '';
        const isInvalid =
          !estStr ||
          estStr === '0' ||
          estStr === '0h' ||
          estStr === '0m' ||
          estStr === '0s' ||
          estStr === '0d' ||
          estStr === '0m 0s' ||
          estStr === '0h 0m';
        if (isInvalid) missing.push(FIELD_DISPLAY_NAMES.originalEstimate || 'Original Estimate');
        break;
      }
    }
  }

  return missing;
}

export function isStoryMissingFields(issue: any, requiredFields: string[] = DEFAULT_REQUIRED_FIELDS): boolean {
  return getStoryMissingFieldNames(issue, requiredFields).length > 0;
}

/**
 * MISSING_FIELDS Rule:
 * Evaluates required fields policy. Groups all missing fields into ONE single notification per issue.
 */
export function evaluateMissingFields(ctx: RuleContext): NotificationCandidate | null {
  const { issue, userId, jiraAccountId, userEmails, requiredFields = DEFAULT_REQUIRED_FIELDS } = ctx;

  // RULE 1: Quality / missing field checks apply ONLY to Stories! (No Epics, Subtasks, Tasks, Bugs)
  const isStory = issue.issueType ? issue.issueType.toLowerCase().includes('story') : true;

  if (!isStory) {
    return null;
  }

  // STRICT REQUIREMENT: Quality / missing fields warnings apply ONLY to stories where REPORTER is ME!
  const isReporterMe =
    (jiraAccountId && issue.reporterId === jiraAccountId) ||
    (userEmails && issue.reporterEmail && userEmails.includes(issue.reporterEmail.toLowerCase()));

  if (!isReporterMe) {
    return null;
  }

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
      case 'originalEstimate': {
        const est = issue.originalEstimate;
        const estStr = est !== null && est !== undefined ? String(est).trim().toLowerCase() : '';
        const isInvalid =
          !estStr ||
          estStr === '0' ||
          estStr === '0h' ||
          estStr === '0m' ||
          estStr === '0s' ||
          estStr === '0d' ||
          estStr === '0m 0s' ||
          estStr === '0h 0m';

        if (isInvalid) {
          missing.push(FIELD_DISPLAY_NAMES.originalEstimate);
        }
        break;
      }
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
