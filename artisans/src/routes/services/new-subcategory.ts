import express, { Request, Response } from "express";
import {
  BadRequestError,
  NotFoundError,
  requireAuth,
  requireSubscription,
  validateRequest,
} from "@theartisans/shared/build";
import { body } from "express-validator";

import { Subcategory, Category } from "../../models/services";

const router = express.Router();

router.post(
  "/artisans/services/subcategory",
  requireAuth,
  requireSubscription(),
  [
    body("name")
      .isString()
      .notEmpty()
      .withMessage("Subcategory name is required!"),
    body("categoryId")
      .isMongoId()
      .notEmpty()
      .withMessage("Category id is required!"),
    body("description")
      .isString()
      .notEmpty()
      .withMessage("Subcategory description is required!"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, description, categoryId } = req.body;
    const subcategoryNameExists = await Subcategory.findOne({
      name: name.toLowerCase(),
    });
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new NotFoundError();
    }
    if (subcategoryNameExists) {
      throw new BadRequestError(`Service with name "${name}" already exists`);
    }
    const subcategory = Subcategory.build({
      name,
      description,
      category,
    });
    await subcategory.save();
    category.subcategories.push(subcategory);
    await category.save();
    res
      .status(201)
      .send({ message: "Successfuly creaed", subcategory: subcategory });
  }
);
export { router as newServiceSubcategoryRouter };
