import Queue from "bull";
import { Billing } from "../models/billing";
import { paymentWrapper } from "../payment-wrapper";
import { BillingCreatedPubliher } from "../events/publisher/billing-created-publisher";
import { natsWrapper } from "../nats-wrapper";
import {
  TransactionStatusTypes,
  TransactionTypes,
} from "@theartisans/shared/build";
import { TransactionCreatedPublisher } from "../events/publisher/transaction-created-publisher";
import { config } from "../config";

interface Payload {
  transactionId: string;
  billingId: string;
  userEmail: string;
}

const pendingTransactionQueue = new Queue<Payload>(
  "pending-transaction-queue",
  {
    redis: {
      host: process.env.REDIS_HOST,
    },
  }
);

pendingTransactionQueue.process(async (job) => {
  const transaction = await paymentWrapper.verifyTransaction(
    job.data.transactionId
  );
  if (transaction.status === "successful") {
    const billing = await Billing.findById(job.data.billingId);
    if (!billing) {
      return Promise.reject("billing details not found");
    }
    billing.set({ cardToken: transaction.token, complete: true });
    await billing.save();
    new BillingCreatedPubliher(natsWrapper.client).publish({
      id: billing.id,
      userId: billing.userId,
      email: job.data.userEmail,
      fullName: billing.cardFullName,
      cardNumber: billing.cardNumber,
      cardExpiryMonth: billing.cardExpiryMonth,
      cardExpiryYear: billing.cardExpiryYear,
      cardToken: billing.cardToken!,
    });
    new TransactionCreatedPublisher(natsWrapper.client).publish({
      userId: billing.userId,
      email: job.data.userEmail,
      gatewayId: job.data.transactionId,
      amount: parseInt(config.BILLING_CHARGE),
      narration: "Attached Billing Information",
      status: TransactionStatusTypes.SUCCESS,
      transactionType: TransactionTypes.BILLING,
      dateCreated: new Date().toISOString(),
    });
    // Publish event
    return Promise.resolve(true);
  }
  return Promise.reject("Not successful");
});
export { pendingTransactionQueue };
