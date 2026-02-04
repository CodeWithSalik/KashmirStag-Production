import React, { useState } from 'react';
import { TfiShoppingCart, TfiPlus, TfiMinus, TfiBag } from 'react-icons/tfi';
import Razorpay from 'razorpay';

const CheckoutForm = ({ cart, subTotal, addToCart, removeFromCart }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        phone: '',
        city: '',
        state: '',
        pincode: '',
    });

    const isFormValid = () => {
        return Object.values(formData).every((value) => value !== '');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const initiatePayment = async () => {
        const orderData = {
            ...formData,
            amount: subTotal * 100,
        };

        try {
            const response = await fetch('/api/razorpay-server', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const order = await response.json();

            const options = {
                key: 'rzp_test_I0iyMM9j7EZ4le',
                order_id: order.id,
                amount: order.amount,
                name: 'Your Company Name',
                description: 'Payment for Course',
                handler: function (response) {
                    console.log('Payment Success:', response);
                },
            };

            const rzp = new Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Error initiating payment:', error);
        }
    };

    return (
        <div className='container px-2 sm:m-auto'>
            <h1 className='font-bold text-3xl my-8 text-center'>Checkout</h1>
            <h2 className='font-semibold text-xl'>1. Delivery details</h2>
            <div className='mx auto flex my-2'>
                {Object.entries(formData).map(([field, value]) => (
                    <div key={field} className='px-2 w-1/2'>
                        <div className='mb-4'>
                            <label htmlFor={field} className='leading-7 text-sm text-gray-600'>
                                {field === 'name' ? 'Full Name' : field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                            <input
                                onChange={handleInputChange}
                                value={value}
                                type={field === 'email' ? 'email' : 'text'}
                                id={field}
                                name={field}
                                className='w-full bg-white rounded border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out'
                            />
                        </div>
                    </div>
                ))}
            </div>

            <h2 className='font-semibold text-xl'>2. Review cart items & pay</h2>
            <div className='sideCart bg bg-yellow-100 m-2 p-6'>
                {Object.keys(cart).length === 0 ? (
                    <div className='my-4 font-semibold'>No items present in the cart! Please add items to checkout.</div>
                ) : (
                    <ol className='list-decimal font-semibold'>
                        {Object.keys(cart).map((k) => (
                            <li key={k}>
                                <div className="item flex my-5">
                                    <div className='font-semibold'>{cart[k].name}({cart[k].size}/{cart[k].variant})</div>
                                    <div className='w-1/3 flex items-center justify-center font-semibold space-x-3'>
                                        <TfiMinus onClick={() => { removeFromCart(k, 1, cart[k].price, cart[k].name, cart[k].size, cart[k].variant) }} className='mx-3 cursor-pointer text-yellow-500 font-bold' /> {cart[k].qty} <TfiPlus onClick={() => { addToCart(k, 1, cart[k].price, cart[k].name, cart[k].size, cart[k].variant) }} className='mx-3 cursor-pointer text-yellow-500 font-bold' />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}

                <span className="font-bold py-2">Subtotal: {subTotal}</span>
            </div>
            <div className='mx-4'>
                <button
                    onClick={initiatePayment}
                    disabled={!isFormValid()}
                    className='flex disabled:bg-yellow-300 mr-2 text-white bg-yellow-500 border-0 py-2 px-2 focus:outline-none hover:bg-yellow-600 rounded text-sm'
                >
                    <TfiBag className='m-1' /> Pay ₹ {subTotal}
                </button>
            </div>
        </div>
    );
};

export default CheckoutForm;
