import { Metadata } from 'next';
import { APP_NAME } from '@/config/constants';

export const metadata: Metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
  description: 'Our privacy policy detailing how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <h1 className="text-4xl font-bold text-brand-800 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none text-text-secondary">
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">1. Introduction</h2>
          <p>
            Welcome to {APP_NAME}. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">2. The Data We Collect</h2>
          <p>
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
            <li><strong>Financial Data:</strong> includes payment card details (processed securely by our payment providers, we do not store full card details).</li>
            <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of products you have purchased from us.</li>
            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">3. How We Use Your Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., fulfilling an order).</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal or regulatory obligation.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">4. Cookies</h2>
          <p>
            You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">5. Third-Party Links</h2>
          <p>
            This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">6. Your Legal Rights</h2>
          <p>
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
          </p>
          <p className="mt-4">
            If you wish to exercise any of the rights set out above, please contact us at support@kashmirstag.com.
          </p>
        </section>
      </div>
    </div>
  );
}
