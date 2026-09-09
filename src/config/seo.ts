import { APP_NAME, APP_DESCRIPTION, APP_URL } from './constants';

export const defaultSeo = {
  title: `${APP_NAME} - Premium Fashion & Lifestyle`,
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: APP_NAME,
    title: `${APP_NAME} - Premium Fashion & Lifestyle`,
    description: APP_DESCRIPTION,
    url: APP_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - Premium Fashion & Lifestyle`,
    description: APP_DESCRIPTION,
  },
};

export function generateProductSeo(product: { name: string; description: string; images?: string[]; slug?: string }) {
  const productUrl = product.slug ? `${APP_URL}/product/${product.slug}` : APP_URL;
  const desc = product.description ? product.description.substring(0, 160) : `Buy ${product.name} at ${APP_NAME}.`;
  return {
    title: `${product.name} | ${APP_NAME}`,
    description: desc,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: 'article',
      title: `${product.name} | ${APP_NAME}`,
      description: desc,
      url: productUrl,
      images: product.images && product.images.length > 0 ? product.images.map(url => ({ url })) : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | ${APP_NAME}`,
      description: desc,
      images: product.images && product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}

export function generateCategorySeo(category: { name: string; description?: string; slug?: string }) {
  const categoryUrl = category.slug ? `${APP_URL}/category/${category.slug}` : APP_URL;
  const desc = category.description ? category.description.substring(0, 160) : `Shop ${category.name} at ${APP_NAME}.`;
  return {
    title: `${category.name} | ${APP_NAME}`,
    description: desc,
    alternates: {
      canonical: categoryUrl,
    },
    openGraph: {
      type: 'website',
      title: `${category.name} | ${APP_NAME}`,
      description: desc,
      url: categoryUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | ${APP_NAME}`,
      description: desc,
    },
  };
}

