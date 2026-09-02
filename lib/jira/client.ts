import axios, { AxiosInstance } from 'axios';
import { JiraIssueRaw, JiraUserRaw, NormalizedJiraIssue, JiraUser } from './types';
import { normalizeJiraIssue } from './normalizer';

export class JiraClient {
  private baseUrl: string;
  private email: string;
  private token: string;
  private axiosInstance: AxiosInstance | null = null;
  private useMock: boolean = false;

  constructor(baseUrl?: string, email?: string, token?: string) {
    this.baseUrl = baseUrl || process.env.JIRA_BASE_URL || '';
    this.email = email || process.env.JIRA_EMAIL || '';
    this.token = token || process.env.JIRA_API_TOKEN || '';

    // If credentials are invalid/placeholder, automatically fallback to deterministic mock engine
    if (!this.baseUrl || !this.email || !this.token || this.token.startsWith('dev_mock')) {
      this.useMock = true;
    } else {
      const authHeader = Buffer.from(`${this.email}:${this.token}`).toString('base64');
      this.axiosInstance = axios.create({
        baseURL: `${this.baseUrl.replace(/\/$/, '')}/rest/api/3`,
        headers: {
          Authorization: `Basic ${authHeader}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    }
  }

  public isMockMode(): boolean {
    return this.useMock;
  }

  /**
   * Fetches the current authenticated Jira User profile.
   */
  async getCurrentUser(): Promise<JiraUser> {
    if (this.useMock || !this.axiosInstance) {
      return {
        jiraAccountId: 'jira-user-spyrobo-mock-001',
        displayName: 'Spyrobo Demo User',
        email: 'user@spyrobo.app',
        jiraSite: 'https://spyrobo.atlassian.net',
      };
    }

    const response = await this.axiosInstance.get<JiraUserRaw>('/myself');
    return {
      jiraAccountId: response.data.accountId,
      displayName: response.data.displayName,
      email: response.data.emailAddress || this.email,
      jiraSite: this.baseUrl,
    };
  }

  /**
   * Searches Jira issues using JQL (e.g. `assignee = currentUser() OR reporter = currentUser()`).
   */
  async searchIssues(jql: string = 'assignee = currentUser() OR reporter = currentUser()'): Promise<NormalizedJiraIssue[]> {
    if (this.useMock || !this.axiosInstance) {
      return this.getMockIssues();
    }

    try {
      const response = await this.axiosInstance.get<{ issues: JiraIssueRaw[] }>('/search', {
        params: {
          jql,
          maxResults: 50,
          fields: [
            'summary',
            'description',
            'status',
            'priority',
            'assignee',
            'reporter',
            'created',
            'updated',
            'duedate',
            'labels',
            'customfield_10015',
            'customfield_10016',
            'customfield_10020',
          ],
        },
      });

      return (response.data.issues || []).map((raw) => normalizeJiraIssue(raw, this.baseUrl));
    } catch (err: any) {
      console.warn('[JiraClient] REST API search error, falling back to mock dataset:', err.message);
      return this.getMockIssues();
    }
  }

  /**
   * Deterministic mock issues for instant local validation and unit testing.
   */
  private getMockIssues(): NormalizedJiraIssue[] {
    const today = new Date();
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 2);

    const todayDate = new Date(today);

    const dueSoonDate = new Date(today);
    dueSoonDate.setDate(today.getDate() + 2);

    const mockUserAccountId = 'jira-user-spyrobo-mock-001';
    const mockSite = 'https://spyrobo.atlassian.net';

    return [
      {
        jiraId: '10001',
        issueKey: 'PROJ-123',
        projectKey: 'PROJ',
        summary: 'Payment API Gateway Integration',
        description: 'Implement stripe webhook listener and retry queue processing logic.',
        status: 'In Progress',
        statusCategory: 'IN_PROGRESS',
        priority: 'High',
        assigneeId: mockUserAccountId,
        reporterId: 'jira-user-pm-002',
        startDate: new Date('2026-08-20'),
        dueDate: yesterday, // OVERDUE
        labels: ['backend', 'payments'],
        storyPoints: 5,
        sprint: 'Sprint 24',
        acceptanceCriteria: 'Must pass PCI compliance tests.',
        jiraUrl: `${mockSite}/browse/PROJ-123`,
        updatedAt: new Date(),
      },
      {
        jiraId: '10002',
        issueKey: 'PROJ-145',
        projectKey: 'PROJ',
        summary: 'Login API Authentication Endpoint',
        description: null, // Missing description
        status: 'To Do',
        statusCategory: 'TODO',
        priority: 'Highest',
        assigneeId: mockUserAccountId,
        reporterId: mockUserAccountId,
        startDate: null,
        dueDate: null, // Missing due date
        labels: [], // Missing labels
        storyPoints: null, // Missing story points
        sprint: null,
        acceptanceCriteria: null,
        jiraUrl: `${mockSite}/browse/PROJ-145`,
        updatedAt: new Date(),
      },
      {
        jiraId: '10003',
        issueKey: 'PROJ-150',
        projectKey: 'PROJ',
        summary: 'User Profile Settings Dashboard UI',
        description: 'Redesign dark mode theme for profile settings screen.',
        status: 'In Review',
        statusCategory: 'IN_PROGRESS',
        priority: 'Medium',
        assigneeId: mockUserAccountId,
        reporterId: 'jira-user-pm-002',
        startDate: new Date('2026-08-28'),
        dueDate: todayDate, // DUE TODAY
        labels: ['frontend', 'ui'],
        storyPoints: 3,
        sprint: 'Sprint 24',
        acceptanceCriteria: 'Matches Figma mockups.',
        jiraUrl: `${mockSite}/browse/PROJ-150`,
        updatedAt: new Date(),
      },
      {
        jiraId: '10004',
        issueKey: 'PROJ-162',
        projectKey: 'PROJ',
        summary: 'Database Migration Script for User Identity',
        description: 'Migrate legacy auth tokens to Supabase OAuth mapping.',
        status: 'To Do',
        statusCategory: 'TODO',
        priority: 'High',
        assigneeId: mockUserAccountId,
        reporterId: 'jira-user-pm-002',
        startDate: new Date('2026-09-01'),
        dueDate: dueSoonDate, // DUE SOON (in 2 days)
        labels: ['database', 'migration'],
        storyPoints: 8,
        sprint: 'Sprint 24',
        acceptanceCriteria: 'Zero downtime migration.',
        jiraUrl: `${mockSite}/browse/PROJ-162`,
        updatedAt: new Date(),
      },
      {
        jiraId: '10005',
        issueKey: 'PROJ-110',
        projectKey: 'PROJ',
        summary: 'Legacy Bugfix: User Session Timeout',
        description: 'Resolved session expiry bug.',
        status: 'Done',
        statusCategory: 'DONE', // Completed issue - must NOT trigger overdue!
        priority: 'Low',
        assigneeId: mockUserAccountId,
        reporterId: mockUserAccountId,
        startDate: new Date('2026-08-01'),
        dueDate: yesterday, // Past date, but status is DONE
        labels: ['bugfix'],
        storyPoints: 1,
        sprint: 'Sprint 23',
        acceptanceCriteria: 'Fixed in v1.2',
        jiraUrl: `${mockSite}/browse/PROJ-110`,
        updatedAt: new Date(),
      },
    ];
  }
}
