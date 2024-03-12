import {
  Listener,
  BillingCreatedEvent,
  Subjects,
} from '@theartisans/shared/build';
import { Message } from 'node-nats-streaming';
import { Billing } from '../../models/billing';
import { queueGroupName } from './queue-group-name';

export class BillingCreatedListener extends Listener<BillingCreatedEvent> {
  subject: Subjects.BillingCreated = Subjects.BillingCreated;
  queueGroupName: string = queueGroupName;
  async onMessage(data: BillingCreatedEvent['data'], msg: Message) {
    const billing = Billing.build({
      cardFullName: data.fullName,
      userId: data.userId,
      id: data.id,
      cardToken: data.cardToken,
      cardExpiryMonth: data.cardExpiryMonth,
      cardExpiryYear: data.cardExpiryYear,
      cardNumber: data.cardNumber,
    });
    await billing.save();
    msg.ack();
  }
}
