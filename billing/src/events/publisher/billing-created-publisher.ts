import {
  Publisher,
  BillingCreatedEvent,
  Subjects,
} from '@theartisans/shared/build';

export class BillingCreatedPubliher extends Publisher<BillingCreatedEvent> {
  subject: Subjects.BillingCreated = Subjects.BillingCreated;
}
