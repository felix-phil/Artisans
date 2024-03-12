import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { TransactionCreatedListener } from "../transaction-created-listener";
import {
  TransactionCreatedEvent,
  TransactionTypes,
  TransactionStatusTypes,
} from "@theartisans/shared/build";

import { natsWrapper } from "../../../nats-wrapper";

const setUp = () => {
  // create listener instance
  const listener = new TransactionCreatedListener(natsWrapper.client);

  // fake event data
  const data: TransactionCreatedEvent["data"] = {
    userId: new mongoose.Types.ObjectId().toHexString(),
    email: "devfelixphil@gmail.com",
    amount: 50,
    narration: "Subscription to PRO",
    status: TransactionStatusTypes.SUCCESS,
    transactionType: TransactionTypes.SUBSCRIPTION,
    dateCreated: new Date().toISOString(),
    gatewayId: "9017",
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg };
};
it("shoud create transaction and acknowledge message on recieving event", async () => {
  const { listener, data, msg } = setUp();
  await listener.onMessage(data, msg);
  expect(msg.ack).toHaveBeenCalled();
});
