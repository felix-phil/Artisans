import express, { Request, Response } from "express";
import {
  BadRequestError,
  requireAuth,
  requireSubscription,
  validateRequest,
} from "@theartisans/shared/build";
import { Artisan } from "../models/artisans";
import { body } from "express-validator";
import { Skill, SkillDoc } from "../models/skills";
import { Subcategory, SubcategoryDoc } from "../models/services";

const router = express.Router();

router.post(
  "/api/artisans",
  requireAuth,
  requireSubscription(),
  [
    body("businessName")
      .isString()
      .notEmpty()
      .withMessage("Business Name is required!"),
    body("country").isString().notEmpty().withMessage("Country is required"),
    body("latitude")
      .isString()
      .notEmpty()
      .withMessage("Locaation (latitude) is required"),
    body("longitude")
      .isString()
      .notEmpty()
      .withMessage("Location (longitude) is required"),
    body("address").isString().notEmpty().withMessage("Address is required"),
    body("skills")
      .isArray()
      .notEmpty()
      .withMessage("Select at least a skill you use in your profession"),
    body("services")
      .isArray()
      .notEmpty()
      .withMessage("Select at least a service you offer"),
    body("businessEmail")
      .isEmail()
      .notEmpty()
      .withMessage("Business email is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      businessName,
      country,
      latitude,
      longitude,
      address,
      skills,
      services,
      businessEmail,
    } = req.body;
    const artisanProfileExists = await Artisan.findOne({
      userId: req.currentUser!.id,
    });
    if (artisanProfileExists) {
      throw new BadRequestError("You already have an artisan account");
    }
    const skillsSelected = await Skill.find({ _id: { $in: skills } });
    const servicesRendered = await Subcategory.find({ _id: { $in: services } });

    const artisan = Artisan.build({
      userId: req.currentUser!.id,
      businessLocation: {
        country,
        latitude,
        longitude,
        address,
      },
      subscription: {
        subscriptionType: req.currentUser!.subscription!.subscriptionType,
        expiryDate: req.currentUser!.subscription!.expiryDate,
      },
      businessName,
      businessEmail,
    });
    skillsSelected.forEach((skill) => artisan.skills.push(skill._id));
    servicesRendered.forEach((service) => artisan.services.push(service._id));
    await artisan.save();
    const artisanRes = await artisan.populate<{
      skills: SkillDoc[];
      services: SubcategoryDoc[];
    }>(["skills", "services"]);
    res.status(201).send({
      message: "Successfuly created",
      artisan: artisanRes,
    });
  }
);

export { router as newArtisanRouter };
