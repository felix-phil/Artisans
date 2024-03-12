import {
  Publisher,
  SubscriptionCreatedEvent,
  Subjects,
} from '@theartisans/shared/build';

export class SubscriptionCreatedPublisher extends Publisher<SubscriptionCreatedEvent> {
  subject: Subjects.SubscriptionCreated = Subjects.SubscriptionCreated;
}
