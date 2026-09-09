import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';
import { CartProvider } from '@/providers/cart-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { APP_NAME, APP_DESCRIPTION } from '@/config/constants';
import { developerConfig } from '@/config/navigation';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - Premium Fashion & Lifestyle`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: APP_NAME,
    title: `${APP_NAME} - Premium Fashion & Lifestyle`,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

const organizationAndWebsiteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://kashmirstag.com/#organization',
      name: APP_NAME,
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://kashmirstag.com',
      logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kashmirstag.com'}/logo.png`,
      description: APP_DESCRIPTION,
      sameAs: [
        developerConfig.github,
        developerConfig.instagram,
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'pirzadasalik116@gmail.com',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://kashmirstag.com/#website',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://kashmirstag.com',
      name: APP_NAME,
      publisher: {
        '@id': 'https://kashmirstag.com/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kashmirstag.com'}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-surface text-text font-sans`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationAndWebsiteJsonLd) }}
        />
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
