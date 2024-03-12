import request from "supertest";
import { app } from "../../app";
import { Transaction } from "../../models/transactions";
import mongoose from "mongoose";
import {
  TransactionStatusTypes,
  TransactionTypes,
} from "@theartisans/shared/build";
jest.setTimeout(60000);

const setUp = async (userId: string, count: number = 21) => {
  const transactions = await Promise.all(
    Array(count)
      .fill("transaction")
      .map((element, index) => {
        const nowDate = new Date();
        const transaction = Transaction.build({
          userId: userId,
          email: "devfelixphil@gmail.com",
          amount: 50 + index,
          narration: "Subscription to PRO",
          status: TransactionStatusTypes.SUCCESS,
          transactionType: TransactionTypes.SUBSCRIPTION,
          dateCreated: new Date(nowDate.setHours(nowDate.getHours() - index)),
          gatewayId: index.toString(),
        });
        transaction.save();
        return transaction;
      })
  );
  return { transactions };
};

it("shows user's transactions sorted by dateCreated and paginated", async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const { transactions } = await setUp(userId);
  const { body } = await request(app)
    .get("/api/transactions?page=1&&sortBy=dateCreated&&sort=ASC")
    .set("Cookie", signin(false, userId))
    .send()
    .expect(200);
  expect(body.transactions.length).toEqual(body.pagination.itemsPerPage);
  expect(body.pagination.total).toEqual(transactions.length);
  expect(new Date(body.transactions[0].dateCreated).getTime()).toBeLessThan(
    new Date(body.transactions[1].dateCreated).getTime()
  );
});

it("shows user's transactions sorted by amount and paginated", async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const { transactions } = await setUp(userId, 22);
  const { body } = await request(app)
    .get("/api/transactions?page=2&&sortBy=amount&&sort=ASC")
    .set("Cookie", signin(false, userId))
    .send()
    .expect(200);
  expect(body.transactions[0].amount).toBeLessThan(body.transactions[1].amount);
});
