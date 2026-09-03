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

    // 2. Fallback to Cookie header (spyrobo_token or spyrobo_session)
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/spyrobo_token=([^;]+)/) || cookieHeader.match(/spyrobo_session=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]).replace(/^["']|["']$/g, '').trim();
      }
    }

    if (!token) return null;

    // 3. Attempt JWT verification
    const decoded = verifyJwtToken(token);
    if (decoded) {
      if (decoded.userId) {
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (user) return user;
      }
      if (decoded.email) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: decoded.email.toLowerCase() },
              { jiraEmail: decoded.email.toLowerCase() },
            ],
          },
        });
        if (user) return user;
      }
    }

    // 4. Legacy session ID fallback
    const userById = await prisma.user.findUnique({ where: { id: token } });
    if (userById) return userById;

    // 5. Fallback email lookup if token is email string
    if (token.includes('@')) {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { email: token.toLowerCase() },
            { jiraEmail: token.toLowerCase() },
          ],
        },
      });
    }

    return null;
  } catch (err) {
    return null;
  }
}
