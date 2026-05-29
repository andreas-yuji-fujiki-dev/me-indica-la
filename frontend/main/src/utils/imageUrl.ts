const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || '';

// URLs legadas salvas com endereço de dev/cloud antigo são reescritas para o domínio atual
const LEGACY_ORIGINS = [
  'http://localhost:3001',
  'https://me-indica-la.onrender.com',
];

export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!SITE_URL) return url;
  for (const origin of LEGACY_ORIGINS) {
    if (url.startsWith(origin)) {
      return url.replace(origin, SITE_URL);
    }
  }
  return url;
}
