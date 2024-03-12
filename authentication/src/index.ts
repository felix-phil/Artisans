import mongoose from "mongoose";

import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import { imageHandler } from "./image-handler";

import { BillingCreatedListener } from "./events/listeners/billing-created-listener";
import { BillingDeletedListener } from "./events/listeners/billing-deleted-listener";
import { SubscriptionCreatedListener } from "./events/listeners/subscription-created-listener";
import { SubscriptionUpdatedListener } from "./events/listeners/subscription-updated-listener";

const PORT: number = 3000;

const start = async () => {
  console.log("Starting up......");

  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY env variable must be defined");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI env variable must be defined");
  }
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error("NATS_CLIENT_ID env variable must be defined");
  }
  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL env variable must be defined");
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error("NATS_CLUSTER_ID env variable must be defined");
  }
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_BUCKET_NAME env variable must be defined");
  }
  if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION env variable must be defined");
  }
  if (!process.env.AWS_ACCESS_KEY) {
    throw new Error("AWS_ACCESS_KEY env variable must be defined");
  }
  if (!process.env.AWS_SECRET_KEY) {
    throw new Error("AWS_SECRET_KEY env variable must be defined");
  }

  try {
    // NATS streaming server initialization

    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );
    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed!");
      process.exit();
    });
    // Closing NAT server on pod closed
    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());

    // Initialize s3 file storage

    imageHandler.initializeS3Storage(
      process.env.AWS_BUCKET_NAME,
      process.env.AWS_REGION,
      process.env.AWS_ACCESS_KEY,
      process.env.AWS_SECRET_KEY
    );

    // MongoDB initialization
    await mongoose.connect(process.env.MONGO_URI);
    mongoose.set("strictQuery", true);
    console.log("Authentication DB Connected");
    // Start Listeners
    new BillingCreatedListener(natsWrapper.client).listen();
    new BillingDeletedListener(natsWrapper.client).listen();
    new SubscriptionCreatedListener(natsWrapper.client).listen();
    new SubscriptionUpdatedListener(natsWrapper.client).listen();
  } catch (error) {
    console.error(error);
  }
  app.listen(PORT, (): void => {
    console.log("Authentication listening on port " + PORT);
  });
};

start();
