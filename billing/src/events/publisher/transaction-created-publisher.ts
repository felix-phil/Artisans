import {
  Publisher,
  Subjects,
  TransactionCreatedEvent,
} from "@theartisans/shared/build";

export class TransactionCreatedPublisher extends Publisher<TransactionCreatedEvent> {
  subject: Subjects.TransactionCreated = Subjects.TransactionCreated;
}
