export interface JiraUserRaw {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
  active?: boolean;
  timeZone?: string;
}

export interface JiraIssueRaw {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string | { type: string; content?: any[] } | null;
    status: {
      name: string;
      id: string;
      statusCategory: {
        id: number;
        key: string; // 'new', 'indeterminate', 'done'
        name: string; // 'To Do', 'In Progress', 'Done'
      };
    };
    priority?: {
      name: string;
      id: string;
    };
    assignee?: JiraUserRaw | null;
    reporter?: JiraUserRaw | null;
    created?: string;
    updated?: string;
    duedate?: string | null;
    labels?: string[];
    // Standard custom field possibilities
    customfield_10015?: string | null; // Often Start date
    customfield_10016?: number | null; // Often Story Points
    customfield_10020?: any | null; // Often Sprint
    customfield_10014?: string | null; // Often Epic Link
    [key: string]: any;
  };
}

export interface NormalizedJiraIssue {
  jiraId: string;
  issueKey: string;
  projectKey: string;
  summary: string;
  description: string | null;
  issueType: string;
  status: string;
  statusCategory: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: string;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  reporterId: string | null;
  reporterName: string | null;
  reporterEmail: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  labels: string[];
  storyPoints: number | null;
  sprint: string | null;
  originalEstimate: string | number | null;
  acceptanceCriteria?: string | null;
  jiraUrl: string;
  updatedAt: Date;
}

export interface JiraUser {
  jiraAccountId: string;
  displayName: string;
  email: string;
  jiraSite: string;
}
