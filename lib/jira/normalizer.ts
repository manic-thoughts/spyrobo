import { JiraIssueRaw, NormalizedJiraIssue } from './types';

/**
 * Extracts plain text from Atlassian Document Format (ADF) description object or raw string.
 */
export function extractTextFromAdf(description: any): string | null {
  if (!description) return null;
  if (typeof description === 'string') return description.trim();

  if (typeof description === 'object' && description.content) {
    const textPieces: string[] = [];

    const traverse = (node: any) => {
      if (!node) return;
      if (node.type === 'text' && node.text) {
        textPieces.push(node.text);
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    };

    traverse(description);
    const result = textPieces.join(' ').trim();
    return result || null;
  }

  return null;
}

/**
 * Normalizes status category string to standard 'TODO' | 'IN_PROGRESS' | 'DONE'.
 */
export function normalizeStatusCategory(rawCategoryKey: string, rawStatusName: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
  const catKey = (rawCategoryKey || '').toLowerCase();
  const name = (rawStatusName || '').toLowerCase();

  if (catKey === 'done' || name.includes('done') || name.includes('closed') || name.includes('resolved')) {
    return 'DONE';
  }
  if (catKey === 'indeterminate' || name.includes('progress') || name.includes('review') || name.includes('qa')) {
    return 'IN_PROGRESS';
  }
  return 'TODO';
}

/**
 * Parses date string without UTC timezone offset corruption.
 */
export function parseJiraDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Normalizes raw Jira API Issue into local domain model.
 */
export function normalizeJiraIssue(raw: JiraIssueRaw, jiraBaseUrl: string): NormalizedJiraIssue {
  const fields = raw.fields || {};
  const projectKey = raw.key ? raw.key.split('-')[0] : 'JIRA';
  
  // Custom field extraction fallbacks
  let storyPoints: number | null = null;
  if (typeof fields.customfield_10016 === 'number') {
    storyPoints = fields.customfield_10016;
  } else if (typeof fields.customfield_10028 === 'number') {
    storyPoints = fields.customfield_10028;
  } else if (typeof fields.storyPoints === 'number') {
    storyPoints = fields.storyPoints;
  }

  let sprintName: string | null = null;
  if (Array.isArray(fields.customfield_10020) && fields.customfield_10020.length > 0) {
    const lastSprint = fields.customfield_10020[fields.customfield_10020.length - 1];
    sprintName = typeof lastSprint === 'string' ? lastSprint : lastSprint.name || null;
  } else if (fields.sprint && typeof fields.sprint === 'string') {
    sprintName = fields.sprint;
  }

  let acceptanceCriteria: string | null = null;
  if (fields.customfield_10029) {
    acceptanceCriteria = extractTextFromAdf(fields.customfield_10029);
  } else if (fields.acceptanceCriteria) {
    acceptanceCriteria = extractTextFromAdf(fields.acceptanceCriteria);
  }

  const rawCatKey = fields.status?.statusCategory?.key || '';
  const rawStatusName = fields.status?.name || 'To Do';

  return {
    jiraId: raw.id,
    issueKey: raw.key,
    projectKey,
    summary: fields.summary || 'Untitled Issue',
    description: extractTextFromAdf(fields.description),
    status: rawStatusName,
    statusCategory: normalizeStatusCategory(rawCatKey, rawStatusName),
    priority: fields.priority?.name || 'Medium',
    assigneeId: fields.assignee?.accountId || null,
    reporterId: fields.reporter?.accountId || null,
    startDate: parseJiraDate(fields.customfield_10015 || fields.created),
    dueDate: parseJiraDate(fields.duedate),
    labels: Array.isArray(fields.labels) ? fields.labels : [],
    storyPoints,
    sprint: sprintName,
    acceptanceCriteria,
    jiraUrl: `${jiraBaseUrl.replace(/\/$/, '')}/browse/${raw.key}`,
    updatedAt: parseJiraDate(fields.updated) || new Date(),
  };
}
