import { resolve } from 'path';
import https from 'https';
import express from 'express';
import cors from 'cors';
import PaytmChecksum from 'paytmchecksum';

const app = express();

// Enable CORS
app.use(cors());

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const paytmParams = {
      body: {
        requestType: 'Payment',
        mid: process.env.PAYTM_MID,
        websiteName: 'YOUR_WEBSITE_NAME',
        orderId: req.body.oid,
        callbackUrl: `${process.env.NEXT_PUBLIC_LHOST}/posttransaction`,
        txnAmount: {
          value: req.body.subTotal,
          currency: 'INR',
        },
        userInfo: {
          custId: req.body.email,
        },
      },
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      process.env.NEXT_PUBLIC_PAYTM_MKEY
    );

    paytmParams.head = {
      signature: checksum,
    };

    const post_data = JSON.stringify(paytmParams);

    const requestAsync = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'securegw.paytm.in',
          port: 443,
          path: `/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${req.body.oid}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length,
          },
        };

        let response = '';

        const post_req = https.request(options, function (post_res) {
          post_res.on('data', function (chunk) {
            response += chunk;
          });

          post_res.on('end', function () {
            console.log('Response: ', response);
            resolve(response);
          });
        });

        post_req.write(post_data);
        post_req.end();
      });
    };

    try {
      const myr = await requestAsync();
      res.status(200).json(myr);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
