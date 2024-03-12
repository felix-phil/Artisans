import express, { Request, Response } from "express";
import {
  BadRequestError,
  requireAuth,
  requireSubscription,
  validateRequest,
} from "@theartisans/shared/build";
import { body } from "express-validator";

import { Skill } from "../../models/skills";

const router = express.Router();

router.post(
  "/api/artisans/skill",
  requireAuth,
  requireSubscription(),
  [
    body("name").isString().notEmpty().withMessage("Skill name is required!"),
    body("description")
      .isString()
      .notEmpty()
      .withMessage("Skill description is required!"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const skillNameExists = await Skill.findOne({
      name: name.toLowerCase(),
    });
    if (skillNameExists) {
      throw new BadRequestError(`Skill with name "${name}" already exists`);
    }
    const skill = Skill.build({
      name,
      description,
    });
    await skill.save();
    res.status(201).send({ message: "Successfuly creaed", skill: skill });
  }
);
export { router as newSkillRouter };
