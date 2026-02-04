// razorpay.js

const Razorpay = require('razorpay');

// Initialize Razorpay with your key and secret
const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_I0iyMM9j7EZ4le', // Replace with your Razorpay key_id
    key_secret: 'hRuQ6rsEpRSLsfnHXmR9FUR9', // Replace with your Razorpay key_secret
});

module.exports = razorpayInstance;
