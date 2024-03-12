import {
  Publisher,
  Subjects,
  SubscriptionPaymentCreatedEvent,
} from "@theartisans/shared/build";

export class SubscriptionPaymentCreatedPublisher extends Publisher<SubscriptionPaymentCreatedEvent> {
  subject: Subjects.SubscriptionPaymentCreated =
    Subjects.SubscriptionPaymentCreated;
}
