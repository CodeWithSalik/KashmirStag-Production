import Link from 'next/link';

const RefundCancellationPolicy = () => {
  return (
    <div className="dark:text-white dark:bg-gray-300">
      <div className="container mx-auto py-8 px-2 md:px-0 text-black">
        <h1 className="text-4xl font-bold mb-6">Refund and Cancellation Policy</h1>
        <h2 className="text-2xl font-semibold mb-4">Refund Policy</h2>
        <p className="mb-4">At KashmirStag.com, our primary focus is customer satisfaction, which is why we strive to provide the best products and services. Please note that product imgs on our website are for representational purposes only and may vary slightly due to lighting conditions or other factors.</p>
        <p className="mb-4">If you are unsatisfied with a product due to a major defect, we will review your case and provide a refund. The following conditions apply to our refund policy:</p>
        <ul className="list-disc ml-8 mb-4">
          <li>Items can only be returned within a 7-day window from the date of delivery.</li>
          <li>To initiate a return request, customers can visit <Link href="https://theKashmirStag.com/contact" className="text-blue-500">KashmirStag.com/contact</Link>.</li>
          <li>A valid reason is required for returning an item.</li>
          <li>Repeatedly returning items as an abuse of our return policy may result in declined return requests.</li>
          <li>Customers cannot apply for a full refund if the item is part of a  Deal of the Day offer .</li>
          <li>In some cases where there is a slight mismatch between the product pictures and the actual product, return requests related to such mismatches may be rejected.</li>
          <li>In rare cases where return pickup is not available with our courier partner, the customer is responsible for sending the product back to us for refund or replacement processing.</li>
        </ul>
        <h2 className="text-2xl font-semibold mb-4">Cancellation Policy</h2>
        <p className="mb-4">To cancel your order, please contact us using the provided contact link. Orders can be canceled until they are shipped from our warehouse. Requests received more than 7 business days prior to the product delivery date will not be processed.</p>
        <p className="mb-4">If you have any questions or concerns regarding our Refund and Cancellation Policy, please contact us at:</p>
        <p className="mb-4">Call/Whatsapp: +91 7051186634<br />Email: salik@cybersalik.in<br />Support Hours: 10 AM - 6 PM 24/7</p>
      </div>
    </div>
  );
};

export default RefundCancellationPolicy;
