import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'spyrobo_production_secret_jwt_key_2026_secure';

export interface JwtPayload {
  userId: string;
  email: string;
  jiraAccountId?: string | null;
  iat?: number;
  exp?: number;
}

export function signJwtToken(payload: { userId: string; email: string; jiraAccountId?: string | null }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}
