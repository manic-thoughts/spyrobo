import { prisma } from '@/lib/db/prisma';
import { verifyJwtToken } from './jwt';

export async function getAuthUserFromRequest(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/spyrobo_session=([^;]+)/);
    if (!match) return null;

    const token = match[1];
    
    // First attempt JWT token verification
    const decoded = verifyJwtToken(token);
    if (decoded && decoded.userId) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) return user;
    }

    // Legacy session string fallback for backward compatibility
    const user = await prisma.user.findUnique({ where: { id: token } });
    return user || null;
  } catch (err) {
    return null;
  }
}
