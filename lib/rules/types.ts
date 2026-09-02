import { NormalizedJiraIssue } from '../jira/types';

export type NotificationType =
  | 'ASSIGNED'
  | 'DUE_TODAY'
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'MISSING_FIELDS'
  | 'STATUS_CHANGE';

export type NotificationSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface RuleContext {
  issue: NormalizedJiraIssue;
  previousIssue?: NormalizedJiraIssue | null;
  userId: string;
  jiraAccountId: string;
  dueSoonDays?: number;
  requiredFields?: string[];
  referenceDate?: Date; // Allows passing fixed dates for unit testing
}

export interface NotificationCandidate {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  eventKey: string; // Used for deterministic deduplication
}
