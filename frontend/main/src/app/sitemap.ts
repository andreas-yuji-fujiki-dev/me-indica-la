import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meindicala.com.br';
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const [categoriesResult, servicesResult, providersResult] = await Promise.allSettled([
      fetch(`${API_URL}/category?limit=1000`).then((r) => r.json()),
      fetch(`${API_URL}/service?limit=1000`).then((r) => r.json()),
      fetch(`${API_URL}/provider?limit=1000&status=APPROVED`).then((r) => r.json()),
    ]);

    const categories =
      categoriesResult.status === 'fulfilled' ? (categoriesResult.value.data ?? []) : [];
    const services =
      servicesResult.status === 'fulfilled' ? (servicesResult.value.data ?? []) : [];
    const providers =
      providersResult.status === 'fulfilled' ? (providersResult.value.data ?? []) : [];

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c: any) => ({
      url: `${SITE_URL}/category/${c.id}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const serviceRoutes: MetadataRoute.Sitemap = services.map((s: any) => ({
      url: `${SITE_URL}/service/${s.id}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const providerRoutes: MetadataRoute.Sitemap = providers.map((p: any) => ({
      url: `${SITE_URL}/provider/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }));

    return [...staticRoutes, ...categoryRoutes, ...serviceRoutes, ...providerRoutes];
  } catch {
    return staticRoutes;
  }
}
