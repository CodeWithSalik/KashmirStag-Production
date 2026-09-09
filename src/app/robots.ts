import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/account/', '/api/', '/checkout'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
