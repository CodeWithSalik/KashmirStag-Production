import { Metadata } from 'next';
import { ContactForm } from './contact-form';
import { APP_NAME } from '@/config/constants';
import { MapPin, Mail, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: `Contact Us | ${APP_NAME}`,
  description: 'Get in touch with KashmirStag customer support. We are here to help you with your orders and inquiries.',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-4">Contact Us</h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto">
          Have a question or need assistance? We&apos;re here to help. Reach out to our customer concierge team and we&apos;ll get back to you promptly.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-xs">
            <h3 className="text-xl font-bold text-text mb-6">Contact Information</h3>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-brand-50 p-3 rounded-full text-brand-700 border border-brand-200/70 shrink-0">
                  <Mail className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="font-semibold text-text mb-1">Email Us</h4>
                  <p className="text-text-secondary text-xs mb-1.5">Our support team responds within 24 hours.</p>
                  <a href="mailto:support@kashmirstag.com" className="text-brand-700 hover:text-brand-800 font-medium text-sm transition-colors">
                    support@kashmirstag.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-50 p-3 rounded-full text-brand-700 border border-brand-200/70 shrink-0">
                  <MapPin className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="font-semibold text-text mb-1">Store Headquarters</h4>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    {APP_NAME}<br />
                    Srinagar, Kashmir<br />
                    Jammu &amp; Kashmir 190001<br />
                    India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-50 p-3 rounded-full text-brand-700 border border-brand-200/70 shrink-0">
                  <Clock className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="font-semibold text-text mb-1">Working Hours</h4>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    Monday &ndash; Saturday<br />
                    9:00 AM &ndash; 6:00 PM (IST)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
