import express, { Request, Response } from "express";
import {
  BadRequestError,
  requireAuth,
  validateRequest,
} from "@theartisans/shared/build";
import { Transaction } from "../models/transactions";
import { query } from "express-validator";
import { config } from "../config";
const router = express.Router();

enum SORT {
  ASC = "ASC",
  DESC = "DESC",
}
enum SORT_BY {
  dateCreated = "dateCreated",
  amount = "amount",
  status = "status",
}
router.get(
  "/api/transactions",
  requireAuth,
  [
    query("page")
      .optional({ checkFalsy: true, nullable: true })
      .isInt()
      .withMessage("query page should be a number"),
    query("sort")
      .optional({ checkFalsy: true, nullable: true })
      .isIn(Object.values(SORT))
      .withMessage(
        "query sort should be of value: " + Object.values(SORT).join(" | ")
      ),
    query("sortBy")
      .optional({ checkFalsy: true, nullable: true })
      .isIn(Object.values(SORT_BY))
      .withMessage(
        "query sortBy should be of value: " + Object.values(SORT_BY).join(" | ")
      ),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const currentPage: number = (req.query.page as number | undefined) || 1;
    const sort: SORT = (req.query.sort as SORT) || SORT.ASC;
    const sortBy: SORT_BY =
      (req.query.sortBy as SORT_BY) || SORT_BY.dateCreated;
    const { PAGINATION_PER_PAGE } = config;

    const totalUserTransactions = await Transaction.find({
      userId: req.currentUser!.id,
    }).countDocuments();

    const transactions = await Transaction.find({
      userId: req.currentUser!.id,
    })
      .skip((currentPage - 1) * PAGINATION_PER_PAGE)
      .limit(PAGINATION_PER_PAGE)
      .sort({ [sortBy]: sort.toLocaleLowerCase() });

    res.status(200).send({
      pagination: {
        total: totalUserTransactions,
        currentPage: currentPage,
        itemsPerPage: PAGINATION_PER_PAGE,
      },
      transactions,
    });
  }
);
export { router as showTransactionsRouter };
