import React from 'react';

const Contact = () => {
  return (
    <div className="min-h-screen dark:bg-gray-100 dark:text-gray-100">
      <div className="max-w-screen-xl px-4 md:px-8 lg:px-12 xl:px-26 py-16 mx-auto bg-gray-100 dark:bg-gray-100 rounded-lg shadow-lg">
        <div className="flex flex-col justify-center items-center">
          <div>
            <h2 className="text-center text-3xl font-bold leading-tight text-black">Lets talk about everything!</h2>
            <img className="h-40 mx-auto py-2" src="logo.png" alt="kashstag Logo" />
            <p className="text-center text-xl lg:text-2xl font-medium leading-tight text-black">Feel free to ask us anything!</p>
            <p className="py-4 px-4 text-md lg:text-md leading-tight text-center text-black">If you have any questions regarding your order, feel free to send an email, call, or WhatsApp us on our support number.</p>
            <div className="flex justify-between">
              <div className="text-center px-5 md:px-0 md:text-left py-10 text-black">
                <span className="font-bold text-black">Corporate Address</span>
                <br />
                KashmirStag Solutions<br />
                33, Auwoora,<br />
                Kupwara, Jammu and Kashmir, 193224<br />
              </div>
              <div className="text-center px-5 md:px-0 md:text-left py-10 text-black">
                <span className="font-bold text-black">Customer Support</span>
                <br />
                Call/WhatsApp: <a className="underline text-blue-600 dark:text-blue-400" rel="noreferrer" target="_blank" href="https://wa.me/7051186634?text=Hi">+91 7051186634</a>
                <br />
                Email: salik@cybersalik.in<br />
                Morning: 10AM - 6PM  24/7<br />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
