import express, { Request, Response } from "express";
import {
  createResponse,
  currentUser,
  PositiveResponseBody,
} from "@theartisans/shared/build";
import { UserSubscription } from "../models/user-subscriptions";
import { Billing } from "../models/billing";
const router = express.Router();

router.get(
  "/api/v1/auth/current-user",
  currentUser,
  async (req: Request, res: Response<PositiveResponseBody<any>>) => {
    const billing = await Billing.findOne({ userId: req.currentUser?.id });
    const subscription = await UserSubscription.findOne({
      userId: req.currentUser?.id,
    });
    res.status(200).send(
      createResponse(
        {
          currentUser: req.currentUser || null,
          activeBillingId: billing?.id || null,
          subscription: subscription
            ? {
                id: subscription.id,
                type: subscription.subscriptionType,
              }
            : null,
        },
        200
      )
    );
  }
);
export { router as currentUserRouter };
