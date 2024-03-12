import express, { Request, Response } from "express";
import {
  requireAuth,
  currentUser,
  NotFoundError,
  BadRequestError,
  PositiveResponseBody,
} from "@theartisans/shared/build";
import { body } from "express-validator";
import multer from "multer";
import { User } from "../models/user";
import { imageHandler, ImageHandler } from "../image-handler";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }); // Image upload middleware

router.patch(
  "/api/v1/auth/update-profile-image",
  currentUser,
  requireAuth,
  upload.single("image"),
  async (req: Request, res: Response<PositiveResponseBody<any>>) => {
    const user = await User.findById(req.currentUser!.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (!req.file) {
      throw new BadRequestError("Image field is required");
    }
    const fileKey = ImageHandler.buildKey(
      "authenttication",
      "profile",
      req.file.originalname
    );
    const uploadResult = await imageHandler.uploadFile(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );
    if (!uploadResult) {
      throw new BadRequestError("Unable to upload file");
    }
    user.set({ profileImage: fileKey });
    await user.save();

    res.status(200).send({
      message: "Profile Image updated!",
      data: { user: user },
      statusCode: 200,
    });
  }
);
export { router as updateProfileImageRouter };
