import {
  SubscriptionUpdatedEvent,
  Listener,
  Subjects,
} from '@theartisans/shared/build';
import { Message } from 'node-nats-streaming';
import { UserSubscription } from '../../models/user-subscriptions';
import { queueGroupName } from './queue-group-name';

export class SubscriptionUpdatedListener extends Listener<SubscriptionUpdatedEvent> {
  subject: Subjects.SubscriptionUpdated = Subjects.SubscriptionUpdated;
  queueGroupName: string = queueGroupName;

  async onMessage(data: SubscriptionUpdatedEvent['data'], msg: Message) {
    const userSubscription = await UserSubscription.findOne({
      _id: data.id,
      version: data.version - 1,
    });
    if (!userSubscription) {
      throw new Error('Subscription not found');
    }
    userSubscription.set({
      subscriptionType: data.subscriptionType,
      expiryDate: new Date(data.expiryDate),
    });

    await userSubscription.save();

    msg.ack();
  }
}
