import express, { Request, Response } from "express";
import multer from "multer";
import {
  BadRequestError,
  requireSubscription,
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from "@theartisans/shared/build";
import { Artisan } from "../models/artisans";
import { imageHandler, ImageHandler } from "../image-handler";
import { param } from "express-validator";
const router = express.Router();

router.post(
  "/api/artisans/update-logo/:artisanId",
  requireAuth,
  requireSubscription(),
  [param("artisanId").isMongoId().withMessage("valid artisan id is required")],
  multer({ storage: multer.memoryStorage() }).single("logo"),
  async (req: Request, res: Response) => {
    const artisanId = req.params.artisanId;
    const artisan = await Artisan.findById(artisanId);
    if (!artisan) {
      throw new NotFoundError();
    }
    if (artisan.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }
    if (!req.file) {
      throw new BadRequestError("logo field is required");
    }
    const fileKey = ImageHandler.buildKey(
      "artisans",
      "logos",
      req.file.originalname
    );
    const uploadResult = await imageHandler.uploadFile(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );
    if (!uploadResult) {
      throw new BadRequestError("Unable to upload logo");
    }
    artisan.set({ businessLogo: fileKey });
    await artisan.save();
    res.status(200).send({ message: "Logo Updated", artisan: artisan });
  }
);

export { router as updateLogoRouter };
