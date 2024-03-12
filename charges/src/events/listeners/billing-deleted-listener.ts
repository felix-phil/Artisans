import {
  Listener,
  BillingDeletedEvent,
  Subjects,
} from '@theartisans/shared/build';
import { Message } from 'node-nats-streaming';
import { Billing } from '../../models/billing';
import { queueGroupName } from './queue-group-name';

export class BillingDeletedListener extends Listener<BillingDeletedEvent> {
  subject: Subjects.BillingDeleted = Subjects.BillingDeleted;
  queueGroupName: string = queueGroupName;
  async onMessage(data: BillingDeletedEvent['data'], msg: Message) {
    const billing = await Billing.findById(data.id);
    if (!billing) {
      throw new Error('Billing not found');
    }
    await billing.deleteOne();
    msg.ack();
  }
}
