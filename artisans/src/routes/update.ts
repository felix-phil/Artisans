import express, { Request, Response } from "express";
import {
  requireAuth,
  requireSubscription,
  validateRequest,
  NotFoundError,
  NotAuthorizedError,
} from "@theartisans/shared/build";
import { Artisan } from "../models/artisans";
import { body, param } from "express-validator";
import { Skill, SkillDoc } from "../models/skills";
import { Subcategory, SubcategoryDoc } from "../models/services";

const router = express.Router();

router.put(
  "/api/artisans/:artisanId",
  requireAuth,
  requireSubscription(),
  [
    param("artisanId")
      .isMongoId()
      .withMessage("Validate artisan id is required"),
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
    body("website")
      .optional({ checkFalsy: true, nullable: true })
      .isURL()
      .withMessage("website should be a valid URL"),
    body("instagram")
      .optional({ checkFalsy: true, nullable: true })
      .isURL()
      .withMessage("instagram should be a valid URL"),
    body("linkedin")
      .optional({ checkFalsy: true, nullable: true })
      .isURL()
      .withMessage("linkedin should be a valid URL"),
    body("twitter")
      .optional({ checkFalsy: true, nullable: true })
      .isURL()
      .withMessage("twitter should be a valid URL"),
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
      website,
      twitter,
      instagram,
      linkedin,
    } = req.body;
    const artisanId = req.params.artisanId;
    const artisan = await Artisan.findById(artisanId);
    if (!artisan) {
      throw new NotFoundError();
    }
    if (artisan.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }
    const skillsSelected = await Skill.find({ _id: { $in: skills } });
    const servicesRendered = await Subcategory.find({ _id: { $in: services } });

    artisan.set({
      businessName,
      businessEmail,
      businessLocation: {
        country,
        latitude,
        longitude,
        address,
      },
      links: {
        website: website || undefined,
        twitter: twitter || undefined,
        instagram: instagram || undefined,
        linkedin: linkedin || undefined,
      },
      skills: skillsSelected.map((skill) => skill._id),
      services: servicesRendered.map((service) => service._id),
    });

    // skillsSelected.forEach((skill) => artisan.skills.push(skill._id));
    // servicesRendered.forEach((service) => artisan.services.push(service._id));
    await artisan.save();
    const artisanRes = await artisan.populate<{
      skills: SkillDoc[];
      services: SubcategoryDoc[];
    }>(["skills", "services"]);
    res.status(200).send({
      message: "Successfuly updated",
      artisan: artisanRes,
    });
  }
);

export { router as updateArtisanRouter };
