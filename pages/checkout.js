import { useState, useEffect } from 'react';
import axios from 'axios';
import { TfiShoppingCart, TfiPlus, TfiMinus, TfiBag } from 'react-icons/tfi';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = false; // Load the script synchronously
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

const Checkout = ({ subTotal, cart, removeFromCart, addToCart }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pincode, setPincode] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [disabled, setDisabled] = useState(true)
  const [order, setOrder] = useState(null);
  const [rzp, setRzp] = useState(null);

  const handleChange = (e) => {
    if (e.target.name === 'name') {
      setName(e.target.value);
    } else if (e.target.name === 'email') {
      setEmail(e.target.value);
    } else if (e.target.name === 'phone') {
      setPhone(e.target.value);
    } else if (e.target.name === 'pincode') {
      setPincode(e.target.value);
    } else if (e.target.name === 'address') {
      setAddress(e.target.value);
    }

    // Check if all form fields are filled and update the isDisabled state
    if (name.length > 3 && email.length > 3 && phone.length > 3 && address.length > 3 && pincode.length > 3) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const createOrderAndPay = async () => {
    try {
      const response = await axios.post('/api/create-razorpay-order', { amount: subTotal * 100 ,cart, name, email: email, pincode, phone });
      const data = response.data;
      setOrder(data);

      if (data) {
        const options = {
          key: 'rzp_test_I0iyMM9j7EZ4le', // Replace with your Razorpay key
          order: data.id,
          amount: data.amount,
          name: 'Kashmir Stag',
          description: 'Payment for Order',
          handler: function (response) {
            console.log('Payment Success:', response);
            // You can handle the payment success here
          },
        };

        const instance = new window.Razorpay(options);
        instance.open();
        setRzp(instance);
      }
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
    }
  };

  return (
    <div className="container px-auto sm:m-auto">
      <h1 className="font-bold text-3xl my-8 text-center">Checkout</h1>
      <h2 className="font-semibold text-xl">1. Delivery details</h2>
      <div className="mx auto flex my-2">
        <div className="px-2 w-1/2">
          <div className="mb-4">
            <label onChange={handleChange} value={name} htmlFor="name" className="leading-7 text-sm text-gray-600">Full Name</label>
            <input type="text" id="name" name="name" className="w-full bg-white rounded border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
          </div>
        </div>
        <div className="px-2 w-1/2">
          <div className="mb-4">
            <label onChange={handleChange} value={email} htmlFor="email" className="leading-7 text-sm text-gray-600">Email</label>
            <input type="email" id="email" name="email" className="w-full bg-white rounded border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
          </div>
        </div>
      </div>
      <div className="px-2 w-full">
        <div className="mb-4">
          <label htmlFor="email" className="leading-7 text-sm text-gray-600">Address</label>
          <textarea onChange={handleChange} value={address} name="address" id="address" cols="30" rows="2" className="w-full bg-white rounded border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"></textarea>
        </div>
      </div>
      <div className="mx auto flex my-2">
        <div className="px-2 w-1/2">
          <div className="mb-4">
            <label onChange={handleChange} value={phone} htmlFor="phone" className="leading-7 text-sm text-gray-600">Phone</label>
            <input type="number" id="phone" name="phone" className="w-full bg-white rounded border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
          </div>
        </div>
        <div className="px-2 w-1/2">
          <div className="mb-4">
            <label onChange={handleChange} value={pincode} htmlFor="pincode" className="leading-7 text-sm text-gray-600">Pincode</label>
            <input type="number" id="pincodee" name="pincode" className="w-full bg-white rounded border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
          </div>
        </div>
      </div>
      <div className="mx auto flex my-2">
        <div className="px-2 w-1/2">
          <div className="mb-4">
            <label value={city} htmlFor="city" className="leading-7 text-sm text-gray-600">City</label>
            <input type="text" id="city" name="city" className="w-full bg-white rounded border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" readOnly={true} />
          </div>
        </div>
        <div className="px-2 w-1/2">
          <div className="mb-4">
            <label value={state}  htmlFor="state" className="leading-7 text-sm text-gray-600">State</label>
            <input type="text" id="state" name="state" className="w-full bg-white rounded border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" readOnly={true}/>
          </div>
        </div>
      </div>
      <h2 className="font-semibold text-xl">2. Review cart items & pay</h2>
      <div className="sideCart bg bg-yellow-100 m-2 p-6">
      <ol className='list-decimal font-semibold'>
          {Object.keys(cart).length == 0 && <div className='my-4 font-semibold'>No items present in cart ! Please add items to checkout </div>}
          {Object.keys(cart).map((k) => {
            return <li key={k}>
              <div className="item flex my-5">
                <div className=' font-semibold'>{cart[k].name}({cart[k].size}/{cart[k].variant})</div>
                <div className='w-1/3 flex items-center justify-center font-semibold space-x-3'>
                  <TfiMinus onClick={() => { removeFromCart(k, 1, cart[k].price, cart[k].name, cart[k].size, cart[k].variant) }} className='mx-3 cursor-pointer text-yellow-500 font-bold' /> {cart[k].qty} <TfiPlus onClick={() => { addToCart(k, 1, cart[k].price, cart[k].name, cart[k].size, cart[k].variant) }} className='mx-3 cursor-pointer text-yellow-500 font-bold' />
                </div>

              </div>
            </li>
          })}
        </ol>
        {/* Your cart items rendering here */}
        <span className="font-bold py-2">Subtotal: {subTotal}</span>
      </div>

      {order ? (
        <div>
          {/* <p>Order ID: {order.id}</p>
          <p>Amount: {order.amount / 100} INR</p> */}
          <button
            onClick={createOrderAndPay}
            className="flex  mr-2 text-white bg-yellow-500 border-0 py-2 px-2 focus:outline-none hover-bg-yellow-600 rounded text-sm"
          >
            Pay Now
          </button>
        </div>
      ) : (
        <button className=" flex  mr-2 text-white bg-yellow-500 border-0 py-2 px-2 focus:outline-none hover-bg-yellow-600 rounded text-sm" onClick={createOrderAndPay}>Pay Now</button>
      )}
    </div>
  );
};

export default Checkout;