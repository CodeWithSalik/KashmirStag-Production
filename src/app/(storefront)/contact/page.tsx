import { Metadata } from 'next';
import { ContactForm } from './contact-form';
import { APP_NAME } from '@/config/constants';
import { HiOutlineMapPin, HiOutlineEnvelope, HiOutlineClock } from 'react-icons/hi2';

export const metadata: Metadata = {
  title: `Contact Us | ${APP_NAME}`,
  description: 'Get in touch with KashmirStag customer support. We are here to help you with your orders and inquiries.',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-800 mb-4">Contact Us</h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Have a question or need assistance? We're here to help. Reach out to our customer support team and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-surface-secondary p-8 rounded-xl border border-border">
            <h3 className="text-xl font-bold text-text mb-6">Contact Information</h3>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-brand-100 p-3 rounded-full text-brand-600 shrink-0">
                  <HiOutlineEnvelope className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-text mb-1">Email Us</h4>
                  <p className="text-text-secondary text-sm mb-2">Our team usually responds within 24 hours.</p>
                  <a href="mailto:pirzadasalik116@gmail.com" className="text-brand-600 hover:text-brand-700 font-medium">
                    pirzadasalik116@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-100 p-3 rounded-full text-brand-600 shrink-0">
                  <HiOutlineMapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-text mb-1">Business Address</h4>
                  <p className="text-text-secondary text-sm">
                    {APP_NAME} Headquarters<br />
                    Srinagar, Kashmir<br />
                    Jammu & Kashmir 190001<br />
                    India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-100 p-3 rounded-full text-brand-600 shrink-0">
                  <HiOutlineClock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-text mb-1">Working Hours</h4>
                  <p className="text-text-secondary text-sm">
                    Monday - Saturday<br />
                    9:00 AM - 6:00 PM (IST)
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
