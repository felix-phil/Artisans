import express, { Request, Response } from "express";
import {
  NotFoundError,
  BadRequestError,
  requireAuth,
  currentUser,
  PositiveResponseBody,
} from "@theartisans/shared/build";
import { User, UserDoc } from "../models/user";
import { signUser } from "../services/sign-user";
const router = express.Router();

router.post(
  "/api/v1/auth/revalidate",
  currentUser,
  requireAuth,
  async (
    req: Request,
    res: Response<PositiveResponseBody<{ user: UserDoc }>>
  ) => {
    const user = await User.findById(req.currentUser!.id);
    if (!user) {
      throw new NotFoundError();
    }
    if (!user.active || user.banned) {
      throw new BadRequestError("user is not active or banned!");
    }
    await signUser(req, user);
    res
      .status(200)
      .send({ data: { user }, message: "Success", statusCode: 200 });
  }
);

export { router as revalidateRouter };
