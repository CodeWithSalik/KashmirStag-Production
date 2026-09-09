import { Metadata } from 'next';
import { APP_NAME } from '@/config/constants';

export const metadata: Metadata = {
  title: `Shipping Information | ${APP_NAME}`,
  description: 'Details about our shipping policies, delivery times, and coverage areas across India.',
};

export default function ShippingInfoPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <h1 className="text-4xl font-bold text-brand-800 mb-8">Shipping Information</h1>
      
      <div className="prose prose-lg max-w-none text-text-secondary">
        <p className="lead text-xl mb-8">
          We want to get your {APP_NAME} products to you as quickly and safely as possible. Read our shipping policy below to understand our delivery process.
        </p>

        <section className="mb-10 bg-surface-secondary p-8 rounded-xl border border-border">
          <h2 className="text-2xl font-bold text-text mb-4">Shipping Charges</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="bg-white p-2 rounded-md shadow-sm shrink-0 border border-border mt-1">✓</div>
              <div>
                <strong>Free Standard Shipping:</strong> Available on all prepaid orders and COD orders above ₹1,499.
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-white p-2 rounded-md shadow-sm shrink-0 border border-border mt-1">₹</div>
              <div>
                <strong>Standard Shipping Rate:</strong> A flat shipping fee of ₹99 is applied to orders below ₹1,499.
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-white p-2 rounded-md shadow-sm shrink-0 border border-border mt-1">COD</div>
              <div>
                <strong>Cash on Delivery (COD) Fee:</strong> An additional handling fee of ₹50 is charged for all Cash on Delivery orders, regardless of order value.
              </div>
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">Processing & Delivery Times</h2>
          <p>
            <strong>Order Processing:</strong> All orders are processed within 1 to 2 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.
          </p>
          <p className="mt-4">
            <strong>Delivery Estimates:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Metro Cities:</strong> 2-4 business days after dispatch.</li>
            <li><strong>Tier 2/3 Cities:</strong> 4-6 business days after dispatch.</li>
            <li><strong>Remote Locations:</strong> 6-8 business days after dispatch.</li>
          </ul>
          <p className="mt-4 text-sm bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-200">
            Please note that these are estimated delivery times. Occasional delays may occur due to high volume, bad weather conditions, or unforeseen logistical issues with our courier partners.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">Order Tracking</h2>
          <p>
            When your order has shipped, you will receive an email and SMS notification from us which will include a tracking link you can use to check its status. Please allow 24 hours for the tracking information to become available.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">Serviceable Areas</h2>
          <p>
            We currently ship PAN India across most pin codes. In the rare event that your pin code is unserviceable by our courier partners, our support team will contact you to find an alternative solution or process a full refund.
          </p>
          <p className="mt-4">
            Currently, we do not offer international shipping.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-text mb-4">Damaged Items During Transit</h2>
          <p>
            If you receive a package that appears damaged or tampered with, please do not accept the delivery. If you have already accepted it, please take photos of the damaged package and items, and contact us immediately at pirzadasalik116@gmail.com with your order number.
          </p>
        </section>
      </div>
    </div>
  );
}
