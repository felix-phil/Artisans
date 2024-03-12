import express, { Response, Request } from "express";
import { body } from "express-validator";
import {
  BadRequestError,
  NotFoundError,
  PositiveResponseBody,
  validateRequest,
} from "@theartisans/shared/build";
import { User } from "../models/user";
import { verifyOTP } from "../services/otp";
import { signUser } from "../services/sign-user";
const router = express.Router();

router.post(
  "/api/v1/auth/verify",
  [
    body("email").isEmail().withMessage("Email is Required!"),
    body("otp").notEmpty().withMessage("OTP is required"),
  ],
  validateRequest,
  async (
    req: Request<{}, {}, { email: string; otp: string }>,
    res: Response<PositiveResponseBody>
  ) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new NotFoundError();
    }
    if (!user.hashedOTP || !user.hashedOTPExpirationDate) {
      throw new BadRequestError("Failed to authenicate");
    }
    const otpIsOkay = await verifyOTP(
      user.hashedOTP,
      user.hashedOTPExpirationDate,
      otp
    );
    if (!otpIsOkay) {
      throw new BadRequestError("Failed to verify OTP");
    }
    user.set({
      active: true,
      hashedOTP: undefined,
      hashedOTPExpirationDate: undefined,
    });
    await user.save();
    if (user.banned) {
      throw new BadRequestError(
        "Your account has been banned, please contact the support team"
      );
    }

    await signUser(req, user);
    res.status(200).send({
      data: { user: user, otpSent: false },
      statusCode: 200,
      message: "Sign in successful",
    });
  }
);

export { router as verifyRouter };
