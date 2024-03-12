import express, { Request, Response } from "express";
import {
  requireAuth,
  currentUser,
  validateRequest,
  NotFoundError,
  PositiveResponseBody,
} from "@theartisans/shared/build";
import { User } from "../models/user";
import { body } from "express-validator";

const router = express.Router();

router.patch(
  "/api/v1/auth/update",
  currentUser,
  requireAuth,
  [
    body("firstName")
      .isString()
      .notEmpty()
      .withMessage("First name is required"),
    body("lastName").isString().notEmpty().withMessage("Last name is required"),
    body("location")
      .isString()
      .notEmpty()
      .withMessage("User location is required"),
  ],
  validateRequest,
  async (
    req: Request<
      {},
      {},
      { firstName: string; lastName: string; location: string }
    >,
    res: Response<PositiveResponseBody<any>>
  ) => {
    const { firstName, lastName, location } = req.body;

    const user = await User.findById(req.currentUser!.id);
    if (!user) {
      throw new NotFoundError();
    }

    user.set({ firstName: firstName, lastName: lastName, location: location });
    await user.save();

    res.status(200).send({
      statusCode: 200,
      data: { user: user },
      message: "Profile updated",
    });
  }
);
export { router as updateRouter };
