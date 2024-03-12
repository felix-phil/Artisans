import mongoose from 'mongoose';

import { app } from './app';
import { natsWrapper } from './nats-wrapper';
import { paymentWrapper } from './payment-wrapper';

const PORT: number = 3000;

const start = async () => {
  console.log('Starting up......');

  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY env variable must be defined');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI env variable must be defined');
  }
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID env variable must be defined');
  }
  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL env variable must be defined');
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID env variable must be defined');
  }
  if (!process.env.FLUTTERWAVE_PUBLIC) {
    throw new Error('FLUTTERWAVE_PUBLIC env variable must be defined');
  }
  if (!process.env.FLUTTERWAVE_SECRET) {
    throw new Error('FLUTTERWAVE_SECRET env variable must be defined');
  }
  if (!process.env.FLUTTERWAVE_ENCKEY) {
    throw new Error('FLUTTERWAVE_ENCKEY env variable must be defined');
  }
  if (!process.env.REDIS_HOST) {
    throw new Error('REDIS_HOST env variable must be defined');
  }
  try {
    // NATS streaming server initialization

    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );
    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed!');
      process.exit();
    });
    // Closing NAT server on pod closed
    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    // Initialize pament gateway
    paymentWrapper.initialize(
      process.env.FLUTTERWAVE_PUBLIC,
      process.env.FLUTTERWAVE_SECRET,
      process.env.FLUTTERWAVE_ENCKEY
    );

    // MongoDB initialization
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Billing DB Connected');
  } catch (error) {
    console.error(error);
  }
  app.listen(PORT, (): void => {
    console.log('Billing listening on port ' + PORT);
  });
};

start();
