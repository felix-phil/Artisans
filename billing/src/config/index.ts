import { Request } from "express";
export const config = {
  BILLING_CHARGE: "1",
  PAYMENT_REDIRECT_PATH_SUCCESS: "/payment/?result=success",
  PAYMENT_REDIRECT_PATH_PENDING: "/payment/?result=pending",
  PAYMENT_REDIRECT_PATH_FAILURE: "/payment/?result=failure",
  getRedirectUriPath: (req: Request) =>
    `${req.protocol}://${req.headers.host}/api/billing/redirect`,
  CURRENCY: "usd",
};
