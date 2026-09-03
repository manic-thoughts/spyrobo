import { NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira/client';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    const userId = match ? match[1] : undefined;

    const client = await JiraClient.forUser(userId);
    const user = await client.getCurrentUser();
    return NextResponse.json({
      connected: true,
      user,
      isMockMode: client.isMockMode(),
      message: client.isMockMode()
        ? 'Running in Spyrobo Mock Mode (Set valid JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN in .env.local or save GUI Credentials to connect live Jira)'
        : 'Successfully connected to Jira Cloud REST API v3',
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
