import {
  Publisher,
  BillingDeletedEvent,
  Subjects,
} from '@theartisans/shared/build';

export class BillingDeletedPubliher extends Publisher<BillingDeletedEvent> {
  subject: Subjects.BillingDeleted = Subjects.BillingDeleted;
}
