import { prisma } from '@/lib/db/prisma';
import { verifyJwtToken } from './jwt';

export async function getAuthUserFromRequest(request: Request) {
  try {
    let token: string | null = null;

    // 1. Check Authorization header (Bearer <token>)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Fallback to Cookie header (spyrobo_token)
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/spyrobo_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) return null;

    // 3. Attempt JWT verification
    const decoded = verifyJwtToken(token);
    if (decoded && decoded.userId) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) return user;
    }

    // 4. Legacy session string fallback for backward compatibility
    const user = await prisma.user.findUnique({ where: { id: token } });
    return user || null;
  } catch (err) {
    return null;
  }
}
