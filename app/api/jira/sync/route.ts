import { NextResponse } from 'next/server';
import { syncService } from '@/lib/sync/sync-service';

export async function POST() {
  try {
    const result = await syncService.syncUser();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
