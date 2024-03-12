import express, { Response, Request } from "express";
import { body } from "express-validator";
import {
  BadRequestError,
  NotFoundError,
  PositiveResponseBody,
  validateRequest,
} from "@theartisans/shared/build";
import { User } from "../models/user";
import { Hashing } from "../services/hashing";
import { verifyOTP } from "../services/otp";
import { UserResetPasswordPublisher } from "../events/publishers/user-reset-password-pblisher";
import { natsWrapper } from "../nats-wrapper";
import { UserPasswordChangedPublisher } from "../events/publishers/user-password-changed-publisher";
const router = express.Router();

router.post(
  "/api/v1/auth/reset",
  [
    body("resetToken").notEmpty().withMessage("Reset Token is Required!"),
    body("otp").notEmpty().withMessage("OTP is Required!"),
    body("newPassword")
      .trim()
      .isStrongPassword()
      .withMessage(
        "Password must be atleast 8 characters in length with atleast one symbol, uppercase and number"
      ),
    body("confirmNewPassword")
      .trim()
      .notEmpty()
      .withMessage("Confirm new password is required"),
  ],
  validateRequest,
  async (
    req: Request<
      {},
      {},
      {
        otp: string;
        resetToken: string;
        newPassword: string;
        confirmNewPassword: string;
      }
    >,
    res: Response<PositiveResponseBody<any>>
  ) => {
    const { otp, resetToken, newPassword, confirmNewPassword } = req.body;
    console.log("Reached here ....");
    let userDecoded;
    try {
      userDecoded = JSON.parse(Hashing.decode(resetToken));
      console.log(userDecoded);
    } catch (err) {
      throw new BadRequestError("Invalid Reset Token");
    }
    const user = await User.findById(userDecoded.id);
    if (!user) {
      throw new NotFoundError();
    }
    if (!user.hashedOTP || !user.hashedOTPExpirationDate) {
      throw new BadRequestError(
        "Failed to reset password, please request for password reset"
      );
    }
    // Verify OTP
    const otpMatches = await verifyOTP(
      user.hashedOTP,
      user.hashedOTPExpirationDate,
      otp
    );
    if (!otpMatches) {
      throw new BadRequestError("Invalid OTP Supplied");
    }
    console.log(otpMatches);
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestError("Password should equal Confirm Password");
    }
    user.set({ password: newPassword, active: true });
    await user.save();

    // Publish password changed email
    new UserPasswordChangedPublisher(natsWrapper.client).publish({
      userId: user.id,
      email: user.email,
    });

    res.status(200).send({
      data: { user: user },
      statusCode: 200,
      message: "You have successfully reset your password, proceed to login",
    });
  }
);
export { router as resetPasswordRouter };
