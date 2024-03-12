import express, { Request, Response } from "express";
import {
  requireAuth,
  BadRequestError,
  SubscriptionType,
  requireBilling,
  TransactionStatusTypes,
  TransactionTypes,
} from "@theartisans/shared/build";
import { body } from "express-validator";
import { paymentWrapper } from "../../../payment-wrapper";
import { Subscription } from "../../../models/subscriptions";
import { UserSubscription } from "../../../models/user-subscriptions";
import { Billing } from "../../../models/billing";
import { SubscriptionPaymentCreatedPublisher } from "../../../events/publishers/subscription-payment-created-publisher.ts";
import { natsWrapper } from "../../../nats-wrapper";
import { subscriptionPendingQueue } from "../../../queues/subscription-pending-queue";
import { TransactionCreatedPublisher } from "../../../events/publishers/transaction-created-publisher";

const router = express.Router();

router.post(
  "/api/charges/payments/subscription/new",
  requireAuth,
  requireBilling,
  [
    body("subscriptionType").notEmpty().isIn(Object.values(SubscriptionType)),
    body("quantity").notEmpty().isNumeric(),
  ],
  async (req: Request, res: Response) => {
    const { subscriptionType, quantity } = req.body;
    const subscriptionPlan = await Subscription.findOne({
      name: subscriptionType,
    });
    if (!subscriptionPlan) {
      throw new BadRequestError(
        "Something wrong, unable to find desired plan. Please contact support!"
      );
    }
    const userSubscription = await UserSubscription.findOne({
      userId: req.currentUser!.id,
    });
    if (userSubscription) {
      throw new BadRequestError(
        "You already have a subscription, check if your plan is upgradeable."
      );
    }
    const billing = await Billing.findById(req.currentUser!.billingId!);

    const payload = paymentWrapper.buildTokenChargePayload({
      token: billing!.cardToken,
      email: req.currentUser!.email,
      amount: subscriptionPlan.price * quantity,
      narration: `Subscription to ${subscriptionPlan.name.toLowerCase()} plan`,
      tx_ref: req.currentUser!.id + new Date().toISOString(),
      first_name: req.currentUser!.firstName,
      last_name: req.currentUser!.lastName,
    });
    const response = await paymentWrapper.chargeWithToken(payload);
    if (
      !response ||
      Object.keys(response).length === 0 ||
      response.status === "error"
    ) {
      throw new BadRequestError("Unable to reach payment gateway");
    }
    const { status } = await paymentWrapper.verifyTransaction(response.data.id);
    if (status === "successful") {
      // publish subscription payment created
      new SubscriptionPaymentCreatedPublisher(natsWrapper.client).publish({
        amount: subscriptionPlan.price,
        userId: req.currentUser!.id,
        email: req.currentUser!.email,
        subscriptionType: subscriptionPlan.name,
        quantity: 1,
        transactionId: response.data.id,
      });
      // TODO: publish transaction created
      new TransactionCreatedPublisher(natsWrapper.client).publish({
        userId: req.currentUser!.id,
        email: req.currentUser!.email,
        gatewayId: response.data.id,
        amount: payload.amount,
        narration: payload.narration,
        status: TransactionStatusTypes.SUCCESS,
        transactionType: TransactionTypes.SUBSCRIPTION,
        dateCreated: new Date().toISOString(),
      });
      return res.status(201).send({
        complete: true,
        pending: false,
        transactionId: response.data.id,
      });
    } else if (status === "pending") {
      // Add a task to queue that repeats transaction verification every 10 minutes for 5 times

      await subscriptionPendingQueue.add(
        {
          transactionId: response.data.id,
          data: {
            amount: subscriptionPlan.price,
            userId: req.currentUser!.id,
            email: req.currentUser!.email,
            subscriptionType: subscriptionPlan.name,
            quantity: 1,
            transactionId: response.data.id,
          },
        },
        { backoff: 60000, attempts: 5 }
      );
      return res.status(200).send({
        complete: false,
        pending: true,
        transactionId: response.data.id,
      });
    } else {
      new TransactionCreatedPublisher(natsWrapper.client).publish({
        userId: req.currentUser!.id,
        email: req.currentUser!.email,
        gatewayId: response.data.id,
        amount: payload.amount,
        narration: payload.narration,
        status: TransactionStatusTypes.FAILED,
        transactionType: TransactionTypes.SUBSCRIPTION,
        dateCreated: new Date().toISOString(),
      });
      throw new BadRequestError("Payment failed");
    }
  }
);
export { router as newSubscriptionPaymentRouter };
