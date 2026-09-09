import { APP_NAME, APP_DESCRIPTION } from './constants';

export const defaultSeo = {
  title: `${APP_NAME} - Premium Fashion`,
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: APP_NAME,
  },
};

export function generateProductSeo(product: { name: string; description: string; images?: string[] }) {
  return {
    title: `${product.name} | ${APP_NAME}`,
    description: product.description.substring(0, 160),
    openGraph: {
      type: 'article',
      title: `${product.name} | ${APP_NAME}`,
      description: product.description.substring(0, 160),
      images: product.images ? product.images.map(url => ({ url })) : [],
    },
  };
}

export function generateCategorySeo(category: { name: string; description?: string }) {
  const desc = category.description || `Shop ${category.name} at ${APP_NAME}`;
  return {
    title: `${category.name} | ${APP_NAME}`,
    description: desc.substring(0, 160),
    openGraph: {
      type: 'website',
      title: `${category.name} | ${APP_NAME}`,
      description: desc.substring(0, 160),
    },
  };
}
