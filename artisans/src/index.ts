import mongoose from "mongoose";

import { app } from "./app";
import { imageHandler } from "./image-handler";
import { natsWrapper } from "./nats-wrapper";

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

    imageHandler.initializeS3Storage(
      process.env.AWS_BUCKET_NAME,
      process.env.AWS_REGION,
      process.env.AWS_ACCESS_KEY,
      process.env.AWS_SECRET_KEY
    );

    // Closing NAT server on pod closed
    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());

    // MongoDB initialization
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Billing DB Connected");
  } catch (error) {
    console.error(error);
  }
  app.listen(PORT, (): void => {
    console.log("artisans listening on port " + PORT);
  });
};

start();
