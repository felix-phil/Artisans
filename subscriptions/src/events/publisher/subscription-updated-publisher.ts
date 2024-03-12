import {
  Publisher,
  SubscriptionUpdatedEvent,
  Subjects,
} from '@theartisans/shared/build';

export class SubscriptionUpdatedPublisher extends Publisher<SubscriptionUpdatedEvent> {
  subject: Subjects.SubscriptionUpdated = Subjects.SubscriptionUpdated;
}
