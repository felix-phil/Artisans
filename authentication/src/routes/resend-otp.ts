import express, { Response, Request } from "express";
import { body } from "express-validator";
import {
  NotFoundError,
  validateRequest,
  BadRequestError,
  PositiveResponseBody,
} from "@theartisans/shared/build";
import { User } from "../models/user";
import {
  setAndSaveUserOTP,
  OTP_EXPIRATION_SECONDS,
} from "../services/set-and-save-user-otp";
import { Hashing } from "../services/hashing";
import { natsWrapper } from "../nats-wrapper";
import { UserSignupOTPPublisher } from "../events/publishers/user-signup-otp-publisher";
import { UserSigninOTPPublisher } from "../events/publishers/user-signin-otp-publisher";
import { UserResetPasswordPublisher } from "../events/publishers/user-reset-password-pblisher";

const router = express.Router();

router.post(
  "/api/v1/auth/resend",
  [
    body("email").isEmail().withMessage("Email is Required!"),
    body("type").notEmpty().isIn(["signin", "signup", "password"]),
  ],
  validateRequest,
  async (
    req: Request<
      {},
      {},
      { email: string; type: "signin" | "signup" | "password" }
    >,
    res: Response<PositiveResponseBody<any>>
  ) => {
    const { email, type } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new NotFoundError();
    }
    const otp = await setAndSaveUserOTP(user);
    const userEncoded = Hashing.encode(
      JSON.stringify({ id: user.id, email: user.email })
    );
    switch (type) {
      case "signin":
        await new UserSigninOTPPublisher(natsWrapper.client).publish({
          userId: user.id,
          email: user.email,
          otp,
          expiresIn: OTP_EXPIRATION_SECONDS,
        });
        break;
      case "signup":
        await new UserSignupOTPPublisher(natsWrapper.client).publish({
          userId: user.id,
          email: user.email,
          otp,
          expiresIn: OTP_EXPIRATION_SECONDS,
        });
        break;
      case "password":
        await new UserResetPasswordPublisher(natsWrapper.client).publish({
          userId: user.id,
          email: user.email,
          resetToken: userEncoded,
          otp,
          expiresIn: OTP_EXPIRATION_SECONDS,
        });
        break;
      default:
        throw new BadRequestError("Invalid resend type");
    }

    res.status(200).send({
      statusCode: 200,
      data: {
        email: user.email,
        active: user.active,
      },
      message: "OTP has been sent",
    });
  }
);
export { router as resendRouter };
