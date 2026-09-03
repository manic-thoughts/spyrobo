let cachedAuthPromise: Promise<any> | null = null;
let cachedUserData: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export async function getCachedAuthUser(forceRefresh = false): Promise<any> {
  const now = Date.now();

  if (!forceRefresh && cachedUserData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedUserData;
  }

  if (!forceRefresh && cachedAuthPromise) {
    return cachedAuthPromise;
  }

  cachedAuthPromise = fetch('/api/auth/me')
    .then((res) => res.json())
    .then((data) => {
      cachedUserData = data;
      lastCacheTime = Date.now();
      cachedAuthPromise = null;
      return data;
    })
    .catch(() => {
      cachedAuthPromise = null;
      return null;
    });

  return cachedAuthPromise;
}

export function clearAuthUserCache() {
  cachedUserData = null;
  cachedAuthPromise = null;
  lastCacheTime = 0;
}
