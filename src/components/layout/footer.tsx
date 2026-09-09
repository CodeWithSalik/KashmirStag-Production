import React from 'react';
import Link from 'next/link';
import { footerLinks, developerConfig } from '@/config/navigation';
import { APP_NAME, APP_DESCRIPTION } from '@/config/constants';
import { HiOutlineMapPin, HiOutlineEnvelope } from 'react-icons/hi2';
import { FaGithub, FaInstagram } from 'react-icons/fa6';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold text-brand-700">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed">
              {APP_DESCRIPTION}
            </p>
            <div className="flex flex-col gap-2 mt-4 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <HiOutlineEnvelope className="w-5 h-5 text-brand-600" />
                <a href="mailto:pirzadasalik116@gmail.com" className="hover:text-brand-600 transition-colors">
                  pirzadasalik116@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <HiOutlineMapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
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
              className="text-text-secondary hover:text-brand-600 transition-colors"
              aria-label="Instagram"
            >
              <FaInstagram className="w-5 h-5" />
            </a>
            <a
              href={developerConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-brand-600 transition-colors"
              aria-label="GitHub"
            >
              <FaGithub className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

