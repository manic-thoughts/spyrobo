import { NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira/client';
import { getAuthUserFromRequest } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const client = await JiraClient.forUser(authUser.id);
    const isConfigured = client.isConfigured() || Boolean(authUser.jiraSite && authUser.jiraApiToken);

    if (!isConfigured) {
      return NextResponse.json({
        connected: false,
        user: null,
        message: 'Jira is not connected for your account yet. Please configure your Jira details below.',
      });
    }

    const user = await client.getCurrentUser();
    return NextResponse.json({
      connected: true,
      user,
      isMockMode: client.isMockMode(),
      message: client.isMockMode()
        ? 'Running in Spyrobo Mock Mode'
        : 'Successfully connected to Jira Cloud',
    });
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
