import { Metadata } from 'next';
import { FAQAccordion } from './faq-accordion';
import { APP_NAME } from '@/config/constants';

export const metadata: Metadata = {
  title: `Frequently Asked Questions | ${APP_NAME}`,
  description: 'Find answers to common questions about shipping, returns, payments, and our products.',
};

const faqs = [
  {
    question: "What is your shipping policy?",
    answer: "We offer free standard shipping on all orders over ₹1,499. Orders are typically processed within 1-2 business days and standard delivery takes 3-7 business days depending on your location in India."
  },
  {
    question: "Do you ship internationally?",
    answer: "Currently, we only ship within India. We are working hard to expand our logistics network to offer international shipping soon."
  },
  {
    question: "What is your return/exchange policy?",
    answer: "We offer a hassle-free 7-day return and exchange policy from the date of delivery. The items must be unused, unwashed, and have original tags attached. Please visit our Returns page to initiate a return."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order is shipped, you will receive an email and SMS with the tracking link and courier details. You can also track your order by logging into your account and visiting the 'Orders' section."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major Credit/Debit Cards, UPI, Net Banking, and popular wallets through our secure payment gateway (Razorpay). We also offer Cash on Delivery (COD) for eligible pin codes."
  },
  {
    question: "Are your products authentically sourced from Kashmir?",
    answer: "Yes, our brand is deeply rooted in Kashmir. While we leverage modern manufacturing for our streetwear like T-shirts and hoodies, our designs, quality control, and core brand ethos are authentically driven by our heritage."
  },
  {
    question: "How do I know my correct size?",
    answer: "We provide a detailed size chart on every product page. We recommend comparing these measurements with a similar item of clothing you already own that fits you well."
  }
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-800 mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-text-secondary">
          Find answers to common questions about our products, shipping, and returns.
        </p>
      </div>

      <div className="bg-surface-secondary p-6 md:p-10 rounded-2xl border border-border">
        <FAQAccordion faqs={faqs} />
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-text-secondary mb-4">Still have questions?</p>
        <a 
          href="/contact" 
          className="inline-flex items-center justify-center h-10 px-6 rounded-md font-medium bg-brand-700 text-white hover:bg-brand-800 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
