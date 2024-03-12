import { SubscriptionUpdatedListener } from '../subscription-updated-listener';
import { Message } from 'node-nats-streaming';
import {
  SubscriptionUpdatedEvent,
  SubscriptionType,
} from '@theartisans/shared/build';
import { natsWrapper } from '../../../nats-wrapper';
import mongoose from 'mongoose';
import { UserSubscription } from '../../../models/user-subscriptions';

const setup = async () => {
  // create listener instance
  const listener = new SubscriptionUpdatedListener(natsWrapper.client);

  // crate fake data
  const subscription = UserSubscription.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    subscriptionType: SubscriptionType.BASIC,
    expiryDate: new Date(),
    version: 0,
  });
  await subscription.save();

  const data: SubscriptionUpdatedEvent['data'] = {
    id: subscription.id,
    email: 'devfelixphil@gmail.com',
    userId: subscription.userId,
    expiryDate: new Date().toISOString(),
    subscriptionType: SubscriptionType.PREMIUM,
    version: 1,
  };

  //   Create msg
  //   @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg, subscription };
};

it('updates user subscription', async () => {
  const { listener, data, msg, subscription } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();

  // Assertions to make sure subscription was updated
  const subs = await UserSubscription.findById(data.id);
  expect(subs).toBeDefined();
  expect(subs!.id).toEqual(subscription.id);
  expect(subs!.version).toEqual(1);
});
