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
   * Creates a JiraClient instance reading GUI credentials from the authenticated user record in DB.
   */
  static async forUser(userId?: string): Promise<JiraClient> {
    try {
      const { prisma } = await import('@/lib/db/prisma');
      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      }
      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            jiraSite: { not: null },
            jiraEmail: { not: null },
            jiraApiToken: { not: null },
          },
          orderBy: { updatedAt: 'desc' },
        });
      }
      if (user && user.jiraSite && (user.jiraEmail || user.email) && user.jiraApiToken) {
        return new JiraClient(user.jiraSite, user.jiraEmail || user.email, user.jiraApiToken);
      }
    } catch (err) {
      console.warn('[JiraClient.forUser] Could not load user credentials from DB:', err);
    }
    return new JiraClient();
  }

  /**
   * Fetches the current authenticated Jira User profile.
   */
  async getCurrentUser(): Promise<JiraUser> {
    if (this.useMock || !this.axiosInstance) {
      return {
        jiraAccountId: 'jira-user-demo-001',
        displayName: 'Jira User',
        email: this.email || 'user@atlassian.com',
        jiraSite: this.baseUrl || '',
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
   * Searches Jira issues using JQL using the new Atlassian REST API v3 /search/jql endpoint.
   */
  async searchIssues(jql?: string): Promise<NormalizedJiraIssue[]> {
    if (this.useMock || !this.axiosInstance) {
      return this.getMockIssues();
    }

    const searchJql = jql || 'created >= -365d ORDER BY updated DESC';
    const fieldsParam = [
      'summary',
      'description',
      'issuetype',
      'status',
      'priority',
      'assignee',
      'reporter',
      'created',
      'updated',
      'duedate',
      'labels',
      'timetracking',
      'timeoriginalestimate',
      'customfield_10015',
      'customfield_10016',
      'customfield_10020',
    ].join(',');

    try {
      const response = await this.axiosInstance.get<{ issues: JiraIssueRaw[] }>('/search/jql', {
        params: {
          jql: searchJql,
          maxResults: 200,
          fields: fieldsParam,
        },
      });

      return (response.data.issues || []).map((raw) => normalizeJiraIssue(raw, this.baseUrl));
    } catch (err: any) {
      console.warn('[JiraClient] REST API search error:', err.message, err.response?.data);
      if (searchJql !== 'created >= -365d ORDER BY updated DESC') {
        try {
          const fallbackRes = await this.axiosInstance.get<{ issues: JiraIssueRaw[] }>('/search/jql', {
            params: { jql: 'created >= -365d ORDER BY updated DESC', maxResults: 200, fields: fieldsParam },
          });
          return (fallbackRes.data.issues || []).map((raw) => normalizeJiraIssue(raw, this.baseUrl));
        } catch (e) {
          // ignore
        }
      }
      return this.getMockIssues();
    }
  }

  /**
   * Fetches list of projects from live Atlassian Jira Cloud instance.
   */
  async getProjects(): Promise<{ id: string; projectKey: string; name: string; jiraSite: string }[]> {
    if (!this.axiosInstance) {
      return [];
    }

    try {
      const response = await this.axiosInstance.get<any[]>('/project');
      if (Array.isArray(response.data)) {
        return response.data.map((p: any) => ({
          id: p.id || p.key,
          projectKey: (p.key || '').toUpperCase(),
          name: p.name || p.key,
          jiraSite: this.baseUrl,
        }));
      }
    } catch (err: any) {
      console.warn('[JiraClient] Failed to fetch live projects:', err.message);
    }

    return [];
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
        issueType: 'Story',
        status: 'In Progress',
        statusCategory: 'IN_PROGRESS',
        priority: 'High',
        assigneeId: mockUserAccountId,
        assigneeName: 'Mock User',
        assigneeEmail: 'user@example.com',
        reporterId: 'jira-user-pm-002',
        reporterName: 'PM Lead',
        reporterEmail: 'pm@example.com',
        startDate: new Date('2026-08-20'),
        dueDate: yesterday, // OVERDUE
        labels: ['backend', 'payments'],
        storyPoints: 5,
        sprint: 'Sprint 24',
        originalEstimate: '4h',
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
        issueType: 'Story',
        status: 'To Do',
        statusCategory: 'TODO',
        priority: 'Highest',
        assigneeId: mockUserAccountId,
        assigneeName: 'Mock User',
        assigneeEmail: 'user@example.com',
        reporterId: mockUserAccountId,
        reporterName: 'Mock User',
        reporterEmail: 'user@example.com',
        startDate: null,
        dueDate: null, // Missing due date
        labels: [], // Missing labels
        storyPoints: null, // Missing story points
        sprint: null,
        originalEstimate: null,
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
        issueType: 'Task',
        status: 'In Review',
        statusCategory: 'IN_PROGRESS',
        priority: 'Medium',
        assigneeId: mockUserAccountId,
        assigneeName: 'Mock User',
        assigneeEmail: 'user@example.com',
        reporterId: 'jira-user-pm-002',
        reporterName: 'PM Lead',
        reporterEmail: 'pm@example.com',
        startDate: new Date('2026-08-28'),
        dueDate: todayDate, // DUE TODAY
        labels: ['frontend', 'ui'],
        storyPoints: 3,
        sprint: 'Sprint 24',
        originalEstimate: '3h',
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
        issueType: 'Story',
        status: 'To Do',
        statusCategory: 'TODO',
        priority: 'High',
        assigneeId: mockUserAccountId,
        assigneeName: 'Mock User',
        assigneeEmail: 'user@example.com',
        reporterId: 'jira-user-pm-002',
        reporterName: 'PM Lead',
        reporterEmail: 'pm@example.com',
        startDate: new Date('2026-09-01'),
        dueDate: dueSoonDate, // DUE SOON (in 2 days)
        labels: ['database', 'migration'],
        storyPoints: 8,
        sprint: 'Sprint 24',
        originalEstimate: '8h',
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
        issueType: 'Bug',
        status: 'Done',
        statusCategory: 'DONE', // Completed issue - must NOT trigger overdue!
        priority: 'Low',
        assigneeId: mockUserAccountId,
        assigneeName: 'Mock User',
        assigneeEmail: 'user@example.com',
        reporterId: mockUserAccountId,
        reporterName: 'Mock User',
        reporterEmail: 'user@example.com',
        startDate: new Date('2026-08-01'),
        dueDate: yesterday, // Past date, but status is DONE
        labels: ['bugfix'],
        storyPoints: 1,
        sprint: 'Sprint 23',
        originalEstimate: '1h',
        acceptanceCriteria: 'Fixed in v1.2',
        jiraUrl: `${mockSite}/browse/PROJ-110`,
        updatedAt: new Date(),
      },
    ];
  }
}
