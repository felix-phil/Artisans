import {
  Listener,
  Subjects,
  TransactionCreatedEvent,
} from "@theartisans/shared/build";
import { Message } from "node-nats-streaming";

import { Transaction } from "../../models/transactions";
import { queueGroupName } from "./queue-group-name";

export class TransactionCreatedListener extends Listener<TransactionCreatedEvent> {
  subject: Subjects.TransactionCreated = Subjects.TransactionCreated;
  queueGroupName: string = queueGroupName;

  async onMessage(
    data: TransactionCreatedEvent["data"],
    msg: Message
  ): Promise<void> {
    const transaction = Transaction.build({
      ...data,
      dateCreated: new Date(data.dateCreated),
    });
    await transaction.save();
    msg.ack();
  }
}
