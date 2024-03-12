import Queue from "bull";
import {
  SubscriptionPaymentCreatedEvent,
  TransactionStatusTypes,
  TransactionTypes,
} from "@theartisans/shared/build";
import { SubscriptionPaymentCreatedPublisher } from "../events/publishers/subscription-payment-created-publisher.ts";
import { paymentWrapper } from "../payment-wrapper";
import { natsWrapper } from "../nats-wrapper";
import { TransactionCreatedPublisher } from "../events/publishers/transaction-created-publisher";

interface Payload {
  transactionId: string;
  data: SubscriptionPaymentCreatedEvent["data"];
}

const subscriptionPendingQueue = new Queue<Payload>(
  "subscription-pending-queue",
  {
    redis: {
      host: process.env.REDIS_HOST,
    },
  }
);

subscriptionPendingQueue.process(async (job) => {
  const transaction = await paymentWrapper.verifyTransaction(
    job.data.transactionId
  );
  if (transaction.status === "successful") {
    await new SubscriptionPaymentCreatedPublisher(natsWrapper.client).publish(
      job.data.data
    );
    new TransactionCreatedPublisher(natsWrapper.client).publish({
      userId: job.data.data.userId,
      email: job.data.data.email,
      gatewayId: job.data.transactionId,
      amount: job.data.data.amount,
      narration: `Subscription to ${job.data.data.subscriptionType.toLowerCase()} plan`,
      status: TransactionStatusTypes.SUCCESS,
      transactionType: TransactionTypes.SUBSCRIPTION,
      dateCreated: new Date().toISOString(),
    });
    return Promise.resolve(true);
  }
  return Promise.reject("Not successful");
});

export { subscriptionPendingQueue };
