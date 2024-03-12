import express, { Request, Response } from "express";
import {
  BadRequestError,
  requireAuth,
  requireSubscription,
  validateRequest,
} from "@theartisans/shared/build";
import { body } from "express-validator";

import { Category } from "../../models/services";

const router = express.Router();

router.post(
  "/api/artisans/services/category",
  requireAuth,
  requireSubscription(),
  [
    body("name")
      .isString()
      .notEmpty()
      .withMessage("Category name is required!"),
    body("description")
      .isString()
      .notEmpty()
      .withMessage("Category description is required!"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const categoryNameExists = await Category.findOne({
      name: name.toLowerCase(),
    });
    if (categoryNameExists) {
      throw new BadRequestError(`Category with name "${name}" already exists`);
    }
    const category = Category.build({
      name,
      description,
    });
    await category.save();
    res.status(201).send({ message: "Successfuly creaed", category: category });
  }
);

export { router as newServiceCategoryRouter };
