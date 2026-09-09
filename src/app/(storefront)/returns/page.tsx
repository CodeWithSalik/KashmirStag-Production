import { Metadata } from 'next';
import { APP_NAME } from '@/config/constants';

export const metadata: Metadata = {
  title: `Return & Refund Policy | ${APP_NAME}`,
  description: 'Learn about our 7-day return policy, how to initiate a return or exchange, and our refund process.',
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <h1 className="text-4xl font-bold text-brand-800 mb-8">Return & Refund Policy</h1>
      
      <div className="prose prose-lg max-w-none text-text-secondary">
        <p className="lead text-xl mb-8">
          We want you to love what you ordered from {APP_NAME}. If something is not right, let us know and we'll do our best to fix it.
        </p>

        <section className="mt-8 bg-brand-50 p-6 rounded-xl border border-brand-100">
          <h2 className="text-2xl font-bold text-brand-800 mb-4 mt-0">7-Day Return Policy</h2>
          <p className="mb-0">
            We offer a hassle-free 7-day return and exchange policy. You can raise a return or exchange request within 7 days of receiving your order.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">Conditions for Return</h2>
          <p>To be eligible for a return or exchange, your item must meet the following criteria:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>The item must be unused, unwashed, and in the same condition that you received it.</li>
            <li>It must be in the original packaging with all tags still attached.</li>
            <li>A valid receipt or proof of purchase must be provided.</li>
          </ul>
          <p className="mt-4 text-sm text-error">
            Note: We cannot accept returns on undergarments, socks, and clearance sale items for hygiene and operational reasons.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">How to Initiate a Return</h2>
          <ol className="list-decimal pl-6 space-y-4 mt-4">
            <li>
              <strong>Log into your account:</strong> Go to the 'Orders' section in your dashboard.
            </li>
            <li>
              <strong>Select the order:</strong> Find the order containing the item you wish to return and click 'Return/Exchange'.
            </li>
            <li>
              <strong>Provide details:</strong> Select the reason for return. If you received a defective or incorrect item, please attach photos.
            </li>
            <li>
              <strong>Pickup:</strong> Once approved, our courier partner will pick up the item from your address within 2-4 business days.
            </li>
          </ol>
          <p className="mt-4">
            If you checked out as a guest, please email us at <strong>pirzadasalik116@gmail.com</strong> with your order number and request.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">Refund Process</h2>
          <p>
            Once we receive your returned item and it passes our quality check, we will process your refund:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Prepaid Orders:</strong> The refund will be credited back to your original method of payment within 5-7 business days.</li>
            <li><strong>COD Orders:</strong> We will send a payout link to your registered email/phone number to collect your bank details, or process it as store credit, within 5-7 business days.</li>
          </ul>
          <p className="mt-4">
            <em>Please note: Shipping charges and COD fees (if any) are non-refundable unless you received a damaged, defective, or incorrect item.</em>
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">Exchanges</h2>
          <p>
            If you need a different size or color, you can opt for an exchange instead of a refund. The process is similar to a return. Once we receive the original item, we will dispatch the replacement item. If the requested size/color is out of stock, we will issue a full refund.
          </p>
        </section>
      </div>
    </div>
  );
}
