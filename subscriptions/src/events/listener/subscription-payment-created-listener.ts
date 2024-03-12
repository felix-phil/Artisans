import {
  Listener,
  SubscriptionPaymentCreatedEvent,
  Subjects,
} from '@theartisans/shared/build';
import { Message } from 'node-nats-streaming';
import { UserSubscription } from '../../models/user-subscriptions';
import { queueGroupName } from './queue-group-name';
import { SubscriptionCreatedPublisher } from '../publisher/subscription-created-publisher';
import { SubscriptionUpdatedPublisher } from '../publisher/subscription-updated-publisher';

const EXPIRATION_SECONDS = 60 * 60 * 24 * 30; // 1 month - 30 days
export class SubscriptionPaymentCreatedListener extends Listener<SubscriptionPaymentCreatedEvent> {
  subject: Subjects.SubscriptionPaymentCreated =
    Subjects.SubscriptionPaymentCreated;

  queueGroupName: string = queueGroupName;

  async onMessage(data: SubscriptionPaymentCreatedEvent['data'], msg: Message) {
    const userSubscription = await UserSubscription.findOne({
      userId: data.userId,
    });
    const expiryDate = new Date();
    expiryDate.setSeconds(
      expiryDate.getSeconds() + EXPIRATION_SECONDS * data.quantity // quantity is the number of months
    );
    if (userSubscription) {
      userSubscription.set({
        subscriptionType: data.subscriptionType,
        dateUpdated: new Date(),
        expiryDate: expiryDate,
        transactionId: data.transactionId,
      });
      await userSubscription.save();
      new SubscriptionUpdatedPublisher(this.client).publish({
        email: data.email,
        expiryDate: userSubscription.expiryDate.toISOString(),
        subscriptionType: userSubscription.subscriptionType,
        id: userSubscription.id,
        version: userSubscription.version,
        userId: userSubscription.userId,
      });
    } else {
      const newUserSubscription = UserSubscription.build({
        userId: data.userId,
        expiryDate: expiryDate,
        subscriptionType: data.subscriptionType,
        transactionId: data.transactionId,
      });
      await newUserSubscription.save();
      new SubscriptionCreatedPublisher(this.client).publish({
        email: data.email,
        expiryDate: newUserSubscription.expiryDate.toISOString(),
        subscriptionType: newUserSubscription.subscriptionType,
        id: newUserSubscription.id,
        version: newUserSubscription.version,
        userId: newUserSubscription.userId,
      });
    }
    msg.ack();
  }
}
