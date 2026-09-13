import React from 'react';
import Link from 'next/link';
import { footerLinks, developerConfig } from '@/config/navigation';
import { APP_NAME, APP_DESCRIPTION } from '@/config/constants';
import { MapPin, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-bold tracking-tight text-text">
                Kashmir<span className="text-brand-700">Stag</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed">
              {APP_DESCRIPTION}
            </p>
            <div className="flex flex-col gap-2 mt-4 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-700 shrink-0" />
                <a href="mailto:support@kashmirstag.com" className="hover:text-brand-700 transition-colors">
                  support@kashmirstag.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <span>Srinagar, Kashmir<br />Jammu & Kashmir 190001</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text uppercase tracking-wider">Shop</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-brand-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text uppercase tracking-wider">Customer Service</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.customerService.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-brand-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text uppercase tracking-wider">Policies</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.policies.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-brand-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>

          <p className="text-sm text-text-secondary flex items-center gap-1.5">
            <span>Built by</span>
            <a
              href={developerConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-text hover:text-brand-600 transition-colors"
            >
              {developerConfig.brand}
            </a>
            <span className="text-text-tertiary/60">•</span>
            <span>&copy; {developerConfig.name}</span>
          </p>

          <div className="flex items-center gap-4">
            <a
              href={developerConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-brand-700 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href={developerConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-brand-700 transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

