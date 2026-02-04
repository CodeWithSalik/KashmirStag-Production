import Link from 'next/link';
;
import React from 'react';

const HomePage = () => {
  return (
    <div className="min-h-screen mx-auto dark:bg-gray-300 dark:text-gray-100">
      <section className="body-font">
        <div className="container mx-auto flex px-5 py-24 items-center justify-center flex-col">
          <img className="w-24 md:w-36 mb-10 object-cover object-center rounded" alt="hero" src="/logo.png" />
          <div className="text-center lg:w-2/3 w-full">
            <h1 className="title-font text-black sm:text-4xl text-3xl mb-2 font-medium">
              Welcome to <span>KashmirStag.com</span>
            </h1>
            <p className="text-xl leading-relaxed mb-2 text-black">
              Buy <span className="text-yellow-700 dark:text-yellow-600 font-semibold">Hoodies,T-Shirts</span>
              <span className="typed-cursor" aria-hidden="true">|</span>
            </p>
            <p className="mb-8 leading-relaxed text-black">
              Introducing KashmirStag, a revolutionary e-commerce platform that delivers amazing products at unbeatable prices.
              Built on a foundation of Next.js and MongoDB, our website offers a seamless shopping experience powered by server-side rendering.
              Whether you are a tech enthusiast or simply looking for a stylish geek T-shirt, KashmirStag has something for everyone.
            </p>
            <div className="flex justify-center">
              <Link href="/tshirts">
                <button className="inline-flex text-black bg-yellow-500 border-0 py-2 px-6 focus:outline-none hover:bg-yellow-600 rounded text-lg" fdprocessedid="978uhj">
                  Start Shopping
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <hr />
      <section className="flex mt-8 body-font mx-8 px-8 text-black">
        <div className="flex flex-col md:w-2/3">
          <h1 className="font-semibold my-2 text-3xl">About KashmirStag</h1>
          <p className="mb-2 leading-relaxed">
            KashmirStag.com is revolutionizing the way India shops for unique, geeky apparel.
            From our one-of-a-kind hoodie designs to our wide selection of stickers, mugs and other accessories, we have everything you need to express your individuality and stand out from the crowd.
            Say goodbye to the hassle of hopping from store to store in search of your perfect geeky look. With just a single click on our website, you can find it all!
          </p>
          <p className="mb-2 leading-relaxed">
            But what sets Codeswear apart from the competition? The answer is simple: our unique designs and commitment to providing the highest quality products.
            We understand the importance of style and durability, which is why we put so much effort into creating unique designs and using only the best materials.
            Dont settle for mediocre clothing and accessories - choose Codeswear and make a statement with your wardrobe.
          </p>
          <p className="mb-2 leading-relaxed">
            At Codeswear, we strive to be more than just an online store - we want to be a community where like-minded individuals can come together and express themselves through fashion.
            Whether youre a gamer, a programmer, or simply someone who loves all things geeky, we have something for you.
            Our collection is curated with the latest trends and fan favorites in mind, ensuring that youll always find something new and exciting.
          </p>
          <p className="mb-2 leading-relaxed">
            We also understand the importance of affordability and convenience.
            Thats why we offer competitive prices and fast shipping, so you can get your hands on your new geeky apparel as soon as possible.
            Plus, with our easy-to-use website and secure checkout process, shopping with us is a breeze.
          </p>
          <p className="mb-6 leading-relaxed">
            So why wait? Visit Codeswear.com today and discover the latest in geeky fashion.
            With our unique designsand high-quality products, were sure youl find something youll love.
            Join our community and express your individuality through fashion.
          </p>
        </div>
        <div className="hidden md:flex w-1/3 mx-1">
          <img src="https://www.codeswear.com/order.jpg" className="object-contain rounded-md" alt="Order" />
        </div>
      </section>
      <section className="body-font">
        <div className="container px-5 py-24 mx-auto">
          <h1 className="text-3xl font-medium title-font mb-12 text-center text-black">Testimonials</h1>
          <div className="flex flex-wrap -m-4">
            <div className="p-4 md:w-1/2 w-full">
              <div className="h-full bg-gray-100 dark:bg-yellow-800 p-8 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="block w-5 h-5 text-black mb-4" viewBox="0 0 975.036 975.036">
                  <path d="M925.036 57.197h-304c-27.6 0-50 22.4-50 50v304c0 27.601 22.4 50 50 50h145.5c-1.9 79.601-20.4 143.3-55.4 191.2-27.6 37.8-69.399 69.1-125.3 93.8-25.7 11.3-36.8 41.7-24.8 67.101l36 76c11.6 24.399 40.3 35.1 65.1 24.399 66.2-28.6 122.101-64.8 167.7-108.8 55.601-53.7 93.7-114.3 114.3-181.9 20.601-67.6 30.9-159.8 30.9-276.8v-239c0-27.599-22.401-50-50-50zM106.036 913.497c65.4-28.5 121-64.699 166.9-108.6 56.1-53.7 94.4-114.1 115-181.2 20.6-67.1 30.899-159.6 30.899-277.5v-239c0-27.6-22.399-50-50-50h-304c-27.6 0-50 22.4-50 50v304c0 27.601 22.4 50 50 50h145.5c-1.9 79.601-20.4 143.3-55.4 191.2-27.6 37.8-69.4 69.1-125.3 93.8-25.7 11.3-36.8 41.7-24.8 67.101l35.9 75.8c11.601 24.399 40.501 35.2 65.301 24.399z"></path>
                </svg>
                <p className="leading-relaxed mb-6">
                  I recently discovered this site and I am so impressed with the quality and selection of hoodies and sweatshirts they offer.
                  Not only are the prices incredibly affordable, but the quality of the clothing is top-notch.
                  I have received many compliments on the items Ive purchased and have been asked where I got them.
                  The customer service is also excellent - they were very helpful with a question I had.
                  I highly recommend this site to anyone looking for high-quality clothing at unbeatable prices.
                </p>
                <a className="inline-flex items-center">
                  <span className="flex-grow flex flex-col pl-4">
                    <span className="title-font font-medium">Suzuki Rao Apte</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">CUSTOMER</span>
                  </span>
                </a>
              </div>
            </div>
            <div className="p-4 md:w-1/2 w-full">
              <div className="h-full bg-gray-100 dark:bg-yellow-800 p-8 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="block w-5 h-5 text-black mb-4" viewBox="0 0 975.036 975.036">
                  <path d="M925.036 57.197h-304c-27.6 0-50 22.4-50 50v304c0 27.601 22.4 50 50 50h145.5c-1.9 79.601-20.4 143.3-55.4 191.2-27.6 37.8-69.399 69.1-125.3 93.8-25.7 11.3-36.8 41.7-24.8 67.101l36 76c11.6 24.399 40.3 35.1 65.1 24.399 66.2-28.6 122.101-64.8 167.7-108.8 55.601-53.7 93.7-114.3 114.3-181.9 20.601-67.6 30.9-159.8 30.9-276.8v-239c0-27.599-22.401-50-50-50zM106.036 913.497c65.4-28.5 121-64.699 166.9-108.6 56.1-53.7 94.4-114.1 115-181.2 20.6-67.1 30.899-159.6 30.899-277.5v-239c0-27.6-22.399-50-50-50h-304c-27.6 0-50 22.4-50 50v304c0 27.601 22.4 50 50 50h145.5c-1.9 79.601-20.4 143.3-55.4 191.2-27.6 37.8-69.4 69.1-125.3 93.8-25.7 11.3-36.8 41.7-24.8 67.101l35.9 75.8c11.601 24.399 40.501 35.2 65.301 24.399z"></path>
                </svg>
                <p className="leading-relaxed mb-6">
                  I recently purchased a hoodie and t-shirt from this onlinee-commerce site and I couldnt be happier with my purchase!
                  The quality of the clothing is top-notch and the designs are unique and stylish.
                  The ordering process was easy and the shipping was fast.
                  I also appreciate the wide variety of sizes available.
                  I highly recommend this site to anyone looking for high-quality, fashionable clothing at a great price.
                </p>
                <a className="inline-flex items-center">
                  <span className="flex-grow flex flex-col pl-4">
                    <span className="title-font font-medium">Sonu Sharma</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">CUSTOMER</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
