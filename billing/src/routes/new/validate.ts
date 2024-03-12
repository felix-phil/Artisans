import express, { Request, Response } from "express";
import {
  requireAuth,
  BadRequestError,
  validateRequest,
} from "@theartisans/shared/build";
import { Billing } from "../../models/billing";
import { body } from "express-validator";
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

router.post(
  "/api/billing/validate",
  requireAuth,
  [body("otp").notEmpty().withMessage("OTP is required!")],
  validateRequest,
  async (req: Request, res: Response) => {
    const { otp } = req.body;
    const billing = await Billing.findOne({ userId: req.currentUser!.id });
    if (!billing || !billing.flwRef) {
      throw new BadRequestError("Billing details not found, try again!");
    }
    const response = await paymentWrapper.chargeWithPinValidateOtp(
      billing.flwRef,
      otp
    );
    if (!response || Object.keys(response).length === 0) {
      throw new BadRequestError("Unable to reach payment gateway");
    }
    if (
      response.data.status === "successful" ||
      response.data.status === "pending"
    ) {
      const { status, token } = await paymentWrapper.verifyTransaction(
        response.data.id
      );
      if (!status || !token) {
        throw new BadRequestError("Unable to reach payment gateway");
      }
      if (status === "successful") {
        billing.set({
          completed: true,
          transactionId: response.data.id,
          cardToken: token,
        });
        await billing.save();
        new BillingCreatedPubliher(natsWrapper.client).publish({
          id: billing.id,
          userId: billing.userId,
          email: req.currentUser!.email,
          fullName: billing.cardFullName,
          cardNumber: billing.cardNumber,
          cardExpiryMonth: billing.cardExpiryMonth,
          cardExpiryYear: billing.cardExpiryYear,
          cardToken: billing.cardToken!,
        });
        new TransactionCreatedPublisher(natsWrapper.client).publish({
          userId: billing.userId,
          email: req.currentUser!.email,
          gatewayId: response.data.id,
          amount: parseInt(config.BILLING_CHARGE),
          narration: "Attached Billing Information",
          status: TransactionStatusTypes.SUCCESS,
          transactionType: TransactionTypes.BILLING,
          dateCreated: new Date().toISOString(),
        });
        return res
          .status(200)
          .send({ validationRequired: false, completed: true, pending: false });
      } else if (status === "pending") {
        billing.set({ transactionId: response.data.id, completed: false });
        await billing.save();
        // Add a task to queue
        await pendingTransactionQueue.add(
          {
            transactionId: response.data.id,
            billingId: billing.id,
            userEmail: req.currentUser!.email,
          },
          { backoff: 600000, attempts: 5 }
        );
        return res.status(200).send({
          validationRequired: false,
          completed: false,
          pending: true,
        });
      }
    }
    throw new BadRequestError("Payment failed, try again");
  }
);

export { router as validateBillingRouter };
