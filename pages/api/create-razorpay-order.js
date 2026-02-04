/* eslint-disable import/no-anonymous-default-export */
import Order from '@/models/Order';
import { v4 as uuidv4 } from 'uuid';
const razorpayInstance = require('./razorpay');

export default async (req, res) => { // Convert the subtotal to paise

    try {
        const { amount } = req.body;

        // Create a Razorpay order
        const options = {
            amount: amount, // Amount in paise
            currency: 'INR',
            receipt: uuidv4(),
        };

        razorpayInstance.orders.create(options, (err, order) => {
            if (err) {
                console.error('Razorpay Order Creation Error:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            res.json(order);
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
