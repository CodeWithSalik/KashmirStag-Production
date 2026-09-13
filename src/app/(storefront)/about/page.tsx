import { Metadata } from 'next';
import Image from 'next/image';
import { APP_NAME } from '@/config/constants';

export const metadata: Metadata = {
  title: `About Us | ${APP_NAME}`,
  description: 'Learn about our brand story, mission, and the Kashmir heritage that inspires our premium fashion and lifestyle products.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-bold text-brand-800 text-center mb-8">
        About {APP_NAME}
      </h1>
      
      <div className="prose prose-lg max-w-none text-text-secondary">
        <p className="text-xl leading-relaxed text-center mb-12">
          Bringing the authentic quality and rich heritage of Kashmir to your doorstep through premium fashion and lifestyle products.
        </p>

        <div className="my-12 p-8 sm:p-12 rounded-2xl bg-brand-950 text-white relative overflow-hidden border border-brand-900 shadow-card">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ca8a04_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-brand-400 bg-brand-900/60 px-3 py-1 rounded-full border border-brand-700/50">
              Centuries of Artisanship
            </span>
            <blockquote className="font-serif text-2xl sm:text-3xl italic text-gray-100 leading-relaxed">
              &ldquo;True elegance is never hurried. It is woven thread by thread, refined stitch by stitch, and passed through generations in the valley of Kashmir.&rdquo;
            </blockquote>
            <p className="text-xs text-brand-300 font-medium tracking-wide uppercase">
              — Master Artisans of Srinagar
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mt-12">
          <div>
            <h2 className="text-2xl font-bold text-brand-800 mb-4">Our Story</h2>
            <p className="mb-4">
              Born from a deep appreciation for the majestic landscapes and rich artisanship of the Kashmir valley, {APP_NAME} was created to share this unique heritage with the world. We believe that true quality comes from a blend of traditional craftsmanship and modern design.
            </p>
            <p>
              Every piece in our collection—from our carefully curated T-shirts and hoodies to our premium footwear—is selected with the utmost attention to detail, ensuring that you receive nothing but the best.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-brand-800 mb-4">Our Mission</h2>
            <p className="mb-4">
              Our mission is to provide premium fashion that doesn&apos;t just look good, but feels authentic. We aim to build a brand that stands for uncompromising quality, sustainable practices, and a deep respect for the origins of our materials and inspirations.
            </p>
            <p>
              We strive to create a seamless shopping experience, bringing the essence of Kashmir&apos;s elegance directly to your wardrobe.
            </p>
          </div>
        </div>

        <div className="mt-16 bg-brand-50 p-8 rounded-xl border border-brand-100">
          <h2 className="text-2xl font-bold text-brand-800 mb-4 text-center">Our Core Values</h2>
          <ul className="grid md:grid-cols-3 gap-6 text-center mt-8">
            <li>
              <h3 className="font-bold text-brand-700 mb-2">Authenticity</h3>
              <p className="text-sm">Genuine products that reflect true craftsmanship and heritage.</p>
            </li>
            <li>
              <h3 className="font-bold text-brand-700 mb-2">Quality</h3>
              <p className="text-sm">Uncompromising standards in every stitch and material we use.</p>
            </li>
            <li>
              <h3 className="font-bold text-brand-700 mb-2">Customer First</h3>
              <p className="text-sm">Dedicated to providing an exceptional experience from discovery to delivery.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
