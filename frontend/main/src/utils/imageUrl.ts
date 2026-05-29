const PROD_API = 'https://me-indica-la.onrender.com';
const LOCAL_API = 'http://localhost:3001';

export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith(LOCAL_API)) {
    return url.replace(LOCAL_API, PROD_API);
  }
  return url;
}
