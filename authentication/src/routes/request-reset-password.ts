import express, { Response, Request } from "express";
import { body } from "express-validator";
import {
  NotFoundError,
  PositiveResponseBody,
  validateRequest,
} from "@theartisans/shared/build";
import { User } from "../models/user";
import { Hashing } from "../services/hashing";
import {
  setAndSaveUserOTP,
  OTP_EXPIRATION_SECONDS,
} from "../services/set-and-save-user-otp";
import { UserResetPasswordPublisher } from "../events/publishers/user-reset-password-pblisher";
import { natsWrapper } from "../nats-wrapper";
const router = express.Router();

router.post(
  "/api/v1/auth/request-reset",
  [body("email").isEmail().withMessage("Email is Required!")],
  validateRequest,
  async (
    req: Request<{}, {}, { email: string }>,
    res: Response<PositiveResponseBody<{ resetToken: string }>>
  ) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new NotFoundError();
    }

    const otp = await setAndSaveUserOTP(user);
    const userEncoded = Hashing.encode(
      JSON.stringify({ id: user.id, email: user.email })
    );
    // Send forgot password otp to user
    await new UserResetPasswordPublisher(natsWrapper.client).publish({
      userId: user.id,
      email: user.email,
      resetToken: userEncoded,
      otp,
      expiresIn: OTP_EXPIRATION_SECONDS,
    });
    res.status(200).send({
      message: "OTP to reset your password has been sent to your mail",
      statusCode: 200,
      data: {
        resetToken: userEncoded,
      },
    });
  }
);
export { router as requestPasswordResetRouter };
