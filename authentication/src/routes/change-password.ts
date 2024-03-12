import express, { Request, Response } from "express";
import {
  requireAuth,
  currentUser,
  NotAuthorizedError,
  BadRequestError,
  validateRequest,
  NotFoundError,
  PositiveResponseBody,
} from "@theartisans/shared/build";
import { User, UserDoc } from "../models/user";
import { natsWrapper } from "../nats-wrapper";
import { body } from "express-validator";
import { Hashing } from "../services/hashing";
import { UserPasswordChangedPublisher } from "../events/publishers/user-password-changed-publisher";

const router = express.Router();

router.patch(
  "/api/v1/auth/change-password",
  currentUser,
  requireAuth,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current Password is required"),
    body("newPassword")
      .trim()
      .notEmpty()
      .isStrongPassword()
      .withMessage(
        "New Password must be atleast 8 characters in length with atleast one symbol, uppercase and number"
      ),
    body("confirmNewPassword")
      .trim()
      .notEmpty()
      .withMessage("Confrim New Password is required"),
  ],
  async (
    req: Request<
      {},
      {},
      {
        currentPassword: string;
        newPassword: string;
        confirmNewPassword: string;
      }
    >,
    res: Response<PositiveResponseBody<UserDoc>>
  ) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(req.currentUser!.id);
    if (!user) {
      throw new NotFoundError();
    }
    const otpMatches = await Hashing.compare(user.password, currentPassword);
    if (!otpMatches) {
      throw new BadRequestError("Current Password supplied is incorrect");
    }
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestError("Passwords are not equal");
    }
    user.set({ password: newPassword });
    await user.save();

    await new UserPasswordChangedPublisher(natsWrapper.client).publish({
      userId: user.id,
      email: user.email,
    });
    res.status(200).send({
      message: "Your password changed!",
      data: user,
      statusCode: 200,
    });
  }
);
export { router as changePasswordRouter };
