import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'spyrobo_production_secret_jwt_key_2026_secure';
}

export interface JwtPayload {
  userId: string;
  email: string;
  jiraAccountId?: string | null;
  iat?: number;
  exp?: number;
}

export function signJwtToken(payload: { userId: string; email: string; jiraAccountId?: string | null }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}
