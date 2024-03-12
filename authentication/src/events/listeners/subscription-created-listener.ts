import {
  SubscriptionCreatedEvent,
  Listener,
  Subjects,
} from '@theartisans/shared/build';
import { Message } from 'node-nats-streaming';
import { UserSubscription } from '../../models/user-subscriptions';
import { queueGroupName } from './queue-group-name';

export class SubscriptionCreatedListener extends Listener<SubscriptionCreatedEvent> {
  subject: Subjects.SubscriptionCreated = Subjects.SubscriptionCreated;
  queueGroupName: string = queueGroupName;

  async onMessage(data: SubscriptionCreatedEvent['data'], msg: Message) {
    const userSubscription = UserSubscription.build({
      id: data.id,
      userId: data.userId,
      subscriptionType: data.subscriptionType,
      expiryDate: new Date(data.expiryDate),
      version: data.version,
    });

    await userSubscription.save();

    msg.ack();
  }
}
