const express = require('express');
const {Client, resources, Webhook} = require('coinbase-commerce-node');
const morgan = require('morgan');
const {
  COINBASE_API_KEY,
  COINBASE_WEBHOOK_SECRET,
  DOMAIN
} = require ('./config');


Client.init(COINBASE_API_KEY);

const {Charge} = resources;

const app = express();

app.use(morgan('dev'));
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get('/create-charge', async(req, res) => {
  const chargeData = {
    name: 'Sound Effect',
    description: 'An awesome sound',
    local_price: {
      amount: '0.2',
      currency: 'USD'
    },
    pricing_type: 'fixed_price',
    metadata: {
      customer_id: 'id_123',
      costomer_name: 'John Lemmon'
    },
    redirect_url: `${DOMAIN}/success-payment`,
    cancel_url: `${DOMAIN}/cancel-payment`,
  }

  const charge = await Charge.create(chargeData);

  res.send(charge);
});

app.post('/payment-handler', (req, res) => {
  const rawBody = req.rawBody;
  const signature = req.headers['x-cc-webhook-signature'];
  const webHookSecret = COINBASE_WEBHOOK_SECRET;

  let event;

  try {
    event = Webhook.verifyEventBody(rawBody, signature, webHookSecret);

    if(event.type === 'charge:pending') {
      console.log('Charge is pending');
    }
    if(event.type === 'charge:confirmed') {
      console.log('Charge is confirmed');
    }
    if(event.type === 'charge:failed') {
      console.log('Charge is failed');
    }

    return res.status(200).send(event.id);
  } catch (error) {
    console.log(error);
    res.status(400).send('failed');
  }
})

app.get('/success-payment', (req, res) => {
  res.send('Payment successfull')
})

app.get('/cancel-payment', (req, res) => {
  res.send('Cancel Payment')
})

app.listen(3000);
console.log("server on port", 3000);