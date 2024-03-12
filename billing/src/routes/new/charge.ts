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
import { TransactionCreatedPublisher } from "../../events/publisher/transaction-created-publisher";
import {
  TransactionStatusTypes,
  TransactionTypes,
} from "@theartisans/shared/build";
import { natsWrapper } from "../../nats-wrapper";
import { config } from "../../config";

const router = express.Router();

enum CHARGE_TYPE {
  AUTH = "AUTH",
  NONE = "NONE",
}
const { BILLING_CHARGE } = config; // 1 USD

router.post(
  "/api/billing/charge",
  requireAuth,
  [
    body("cardNumber")
      .notEmpty()
      .isCreditCard()
      .withMessage("Valid card number is required"),
    body("cardExpiryMonth")
      .notEmpty()
      .withMessage("card expiry month is required!"),
    body("cardExpiryYear")
      .notEmpty()
      .withMessage("card expiry year is required"),
    body("cardCvv").notEmpty().withMessage("card cvv is required"),
    body("cardFullName").notEmpty().withMessage("card fullname is required"),
    body("chargeType").notEmpty().isIn(Object.values(CHARGE_TYPE)),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCvv,
      cardFullName,
      chargeType,

      // CHARGE_TYPE=AUTH data
      authMode,
      authFields,
      authFieldValues,
    } = req.body;

    const billingExists = await Billing.findOne({
      userId: req.currentUser!.id,
      completed: true,
    });
    if (billingExists) {
      throw new BadRequestError(
        "You already have a billing card linked, to use another card please delete it and link a new one"
      );
    }
    // Create payload for charging card
    const defaultPayload = paymentWrapper.buildPayload({
      preauthorize: true,
      amount: BILLING_CHARGE,
      cardCvv,
      cardExpiryMonth,
      cardExpiryYear,
      fullName: cardFullName,
      cardNumber,
      email: req.currentUser!.email,
      currency: config.CURRENCY,
      txRef: req.currentUser!.id + new Date().toISOString(),
      redirect_url: config.getRedirectUriPath(req),
    });

    if (chargeType === CHARGE_TYPE.NONE) {
      // Charge the card
      const response = await paymentWrapper.chargeCard(defaultPayload);
      if (!response || Object.keys(response).length === 0) {
        throw new BadRequestError("Unable to reach payment gateway");
      }
      const billing = Billing.build({
        cardNumber,
        cardExpiryMonth,
        cardExpiryYear,
        cardFullName,
        userId: req.currentUser!.id,
      });

      // check if card needs authorization and type of authorization
      switch (response?.meta?.authorization?.mode) {
        case "pin":
        case "avs_noauth":
          const authMode = response?.meta?.authorization?.mode;
          const authFields = response?.meta?.authorization?.fields;

          return res.status(200).send({
            authRequired: true,
            authMode: authMode,
            authFields: authFields,
            completed: false,
            pending: false,
          });
        case "redirect":
          const authUrl = response.meta.authorization.redirect;

          billing.set({
            txRef: response.data.tx_ref,
            transactionId: response.data.id,
          });
          await billing.save();
          return res.status(200).send({
            authRequired: true,
            authMode: response.meta.authorization.mode,
            redirect_uri: authUrl,
            completed: false,
            pending: false,
          });
        default:
          const { status, token } = await paymentWrapper.verifyTransaction(
            response.data.id
          );
          if (!status || !token) {
            throw new BadRequestError("Unable to verify payment");
          }
          if (status === "successful") {
            billing.set({
              transactionId: response.data.id,
              cardToken: token,
              completed: true,
            });
            await billing.save();
            // Publish an event
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
              userId: req.currentUser!.id,
              email: req.currentUser!.email,
              gatewayId: response.data.id,
              amount: parseInt(BILLING_CHARGE),
              narration: "Attached Billing Information",
              status: TransactionStatusTypes.SUCCESS,
              transactionType: TransactionTypes.BILLING,
              dateCreated: new Date().toISOString(),
            });
            return res
              .status(200)
              .send({ authRequired: false, completed: true, pending: false });
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
            return res
              .status(200)
              .send({ authRequired: false, completed: false, pending: true });
          } else {
            throw new BadRequestError("Payment failed, please try again later");
          }
      }
    } else if (chargeType === CHARGE_TYPE.AUTH) {
      if (!authMode) {
        throw new BadRequestError("Auth mode is required");
      }
      if (!authFields || authFields.length === 0 || !authFieldValues) {
        throw new BadRequestError("Auth Fields and values are required");
      }
      const payload: any = { ...defaultPayload };
      payload.authorization = { mode: authMode };
      payload.authorization.fields = authFields;
      (authFields as string[]).forEach((field) => {
        payload.authorization[field] = authFieldValues[field];
      });
      const response = await paymentWrapper.chargeCard(payload);
      if (!response || Object.keys(response).length === 0) {
        throw new BadRequestError("Unable to reach payment gateway");
      }
      const billing = Billing.build({
        cardNumber,
        cardExpiryMonth,
        cardExpiryYear,
        cardFullName,
        userId: req.currentUser!.id,
      });
      switch (response?.meta?.authorization?.mode) {
        case "otp":
          billing.set({ flwRef: response.data.flw_ref });
          await billing.save();
          return res.status(200).send({
            validationRequired: true,
            validationMode: response.meta.authorization.mode,
            completed: false,
            flwRef: response.data.flw_ref,
          });
        case "redirect":
          const authUrl = response.meta.authorization.redirect;

          billing.set({
            txRef: response.data.tx_ref,
          });
          await billing.save();
          return res.status(200).send({
            validationRequired: true,
            validationMode: response.meta.authorization.mode,
            redirect_uri: authUrl,
            completed: false,
            pending: false,
          });
        default:
          console.log(response);
          const { status, token } = await paymentWrapper.verifyTransaction(
            response.data.id
          );
          if (!status || !token) {
            throw new BadRequestError("Unable to verify payment");
          }
          if (status === "successful") {
            billing.set({
              transactionId: response.data.id,
              cardToken: token,
              completed: true,
            });
            await billing.save();
            // Publish event
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
              userId: req.currentUser!.id,
              email: req.currentUser!.email,
              gatewayId: response.data.id,
              amount: parseInt(BILLING_CHARGE),
              narration: "Attached Billing Information",
              status: TransactionStatusTypes.SUCCESS,
              transactionType: TransactionTypes.BILLING,
              dateCreated: new Date().toISOString(),
            });
            return res.status(200).send({
              validationRequired: false,
              completed: true,
              pending: false,
            });
          } else if (status === "pending") {
            billing.set({ transactionId: response.data.id, completed: false });
            await billing.save();
            // Add a task to queue that repeats transaction verification every 10 minutes for 5 times
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
          } else {
            throw new BadRequestError("Payment failed, please try again later");
          }
      }
    }
    console.log("reached heare");

    throw new BadRequestError("Something went wrong");
  }
);

export { router as chargeBillingRouter };
