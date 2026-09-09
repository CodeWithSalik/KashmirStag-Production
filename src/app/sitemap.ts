import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/constants';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Collection from '@/models/Collection';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${APP_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${APP_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/shipping-info`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${APP_URL}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    await connectDB();

    const [products, categories, collections] = await Promise.all([
      Product.find({ status: 'active', isVisible: true }, 'slug updatedAt').lean(),
      Category.find({ isActive: true }, 'slug updatedAt').lean(),
      Collection.find({ isActive: true }, 'slug updatedAt').lean(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
      url: `${APP_URL}/product/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c: any) => ({
      url: `${APP_URL}/category/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const collectionRoutes: MetadataRoute.Sitemap = collections.map((col: any) => ({
      url: `${APP_URL}/collection/${col.slug}`,
      lastModified: col.updatedAt ? new Date(col.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...collectionRoutes];
  } catch (error) {
    console.error('[Sitemap] Failed to generate dynamic sitemap entries:', error);
    return staticRoutes;
  }
}
