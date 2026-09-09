import { Metadata } from 'next';
import { APP_NAME } from '@/config/constants';

export const metadata: Metadata = {
  title: `Terms & Conditions | ${APP_NAME}`,
  description: 'Terms and conditions for using the KashmirStag website and purchasing our products.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <h1 className="text-4xl font-bold text-brand-800 mb-8">Terms & Conditions</h1>
      
      <div className="prose prose-lg max-w-none text-text-secondary">
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">1. Agreement to Terms</h2>
          <p>
            These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and {APP_NAME} ("we," "us" or "our"), concerning your access to and use of the {APP_NAME}.com website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">2. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">3. User Representations</h2>
          <p>By using the Site, you represent and warrant that:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>All registration information you submit will be true, accurate, current, and complete.</li>
            <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
            <li>You have the legal capacity and you agree to comply with these Terms and Conditions.</li>
            <li>You will not use the Site for any illegal or unauthorized purpose.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">4. Products and Pricing</h2>
          <p>
            All products are subject to availability. We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change. We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the Site. However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">5. Purchases and Payment</h2>
          <p>
            We accept various forms of payment including credit cards, debit cards, UPI, and net banking. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Site. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">6. Modifications and Interruptions</h2>
          <p>
            We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site.
          </p>
        </section>
      </div>
    </div>
  );
}
