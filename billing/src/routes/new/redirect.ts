import express, { Request, Response } from "express";
import { NotFoundError } from "@theartisans/shared/build";
import { Billing } from "../../models/billing";
import { paymentWrapper } from "../../payment-wrapper";
import { pendingTransactionQueue } from "../../queues/pending-transaction-queue";
import { BillingCreatedPubliher } from "../../events/publisher/billing-created-publisher";
import { natsWrapper } from "../../nats-wrapper";
import {
  TransactionStatusTypes,
  TransactionTypes,
} from "@theartisans/shared/build";
import { TransactionCreatedPublisher } from "../../events/publisher/transaction-created-publisher";
import { config } from "../../config";

const router = express.Router();

router.post("/api/billing/redirect", async (req: Request, res: Response) => {
  let response;
  try {
    response = JSON.parse(req.query.response as any);
  } catch (err) {
    return res.redirect(400, config.PAYMENT_REDIRECT_PATH_FAILURE); //create route in frontend
  }

  if (!(response.status === "successful") && !(response.status === "pending")) {
    return res.redirect(400, config.PAYMENT_REDIRECT_PATH_FAILURE); //create route in frontend
  }
  const billing = await Billing.findOne({ txRef: response.txRef });
  if (!billing || !billing.transactionId) {
    throw new NotFoundError();
  }
  const { status, token } = await paymentWrapper.verifyTransaction(
    billing.transactionId
  );
  if (!status || !token) {
    return res.redirect(400, config.PAYMENT_REDIRECT_PATH_FAILURE); //create route in frontend
  }
  if (status === "successful") {
    billing.set({ cardToken: token, completed: true });
    new BillingCreatedPubliher(natsWrapper.client).publish({
      id: billing.id,
      userId: billing.userId,
      email:
        req.currentUser?.email ||
        response.customer.email ||
        "support@theartisans.com",
      fullName: billing.cardFullName,
      cardNumber: billing.cardNumber,
      cardExpiryMonth: billing.cardExpiryMonth,
      cardExpiryYear: billing.cardExpiryYear,
      cardToken: billing.cardToken!,
    });
    new TransactionCreatedPublisher(natsWrapper.client).publish({
      userId: billing.userId,
      email:
        req.currentUser?.email ||
        response.customer.email ||
        "support@theartisans.com",
      gatewayId: response.data.id,
      amount: parseInt(config.BILLING_CHARGE),
      narration: "Attached Billing Information",
      status: TransactionStatusTypes.SUCCESS,
      transactionType: TransactionTypes.BILLING,
      dateCreated: new Date().toISOString(),
    });
    return res.redirect(200, config.PAYMENT_REDIRECT_PATH_SUCCESS); //create route in frontend
  } else if (status === "pending") {
    await pendingTransactionQueue.add(
      {
        transactionId: billing.transactionId,
        billingId: billing.id,
        userEmail:
          req.currentUser?.email ||
          response.customer.email ||
          "support@theartisans.com",
      },
      { backoff: 600000, attempts: 5 }
    );
    return res.redirect(200, config.PAYMENT_REDIRECT_PATH_PENDING); //create route in frontend
  }
});

export { router as redirectBillingRouter };
