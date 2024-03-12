import jwt from "jsonwebtoken";
import { Request } from "express";
import { UserDoc } from "../models/user";
import { UserSubscription } from "../models/user-subscriptions";
import { SubscriptionType } from "@theartisans/shared/build";
import { Billing } from "../models/billing";

export const signUser = async (req: Request, user: UserDoc) => {
  user.lastLogin = new Date();
  user.loginCount = user.loginCount + 1;
  const subscription = await UserSubscription.findOne({ userId: user.id });
  const billing = await Billing.findOne({ userId: user.id });

  let userSubscription: null | {
    subscriptionType: SubscriptionType;
    id: string;
    expiryDate: Date;
  } = null;

  const currentDate = new Date();
  if (
    subscription &&
    subscription.expiryDate.getTime() > currentDate.getTime()
  ) {
    userSubscription = {
      subscriptionType: subscription.subscriptionType,
      id: subscription.id,
      expiryDate: subscription.expiryDate,
    };
  }
  await user.save();
  const payload: typeof req.currentUser = {
    id: user.id,
    email: user.email,
    roles: user.roles,
    firstName: user.firstName,
    lastName: user.lastName,
    active: user.active,
    banned: user.banned,
    subscription: userSubscription,
    mobileNumber: user.mobileNumber,
    loginCount: user.loginCount,
    lastLogin: user.lastLogin,
    profileImageUrl: user.profileImageUrl,
    billingId: billing?.id,
  };
  const userJWT = jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: "2h" });

  req.session = {
    jwt: userJWT,
  };
};
