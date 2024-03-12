import { SubscriptionCreatedListener } from '../subscription-created-listener';
import { Message } from 'node-nats-streaming';
import {
  SubscriptionCreatedEvent,
  SubscriptionType,
} from '@theartisans/shared/build';
import { natsWrapper } from '../../../nats-wrapper';
import mongoose from 'mongoose';
import { UserSubscription } from '../../../models/user-subscriptions';

const setup = async () => {
  // create listener instance
  const listener = new SubscriptionCreatedListener(natsWrapper.client);

  // crate fake data
  const data: SubscriptionCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'devfelixphil@gmail.com',
    userId: new mongoose.Types.ObjectId().toHexString(),
    expiryDate: new Date().toISOString(),
    subscriptionType: SubscriptionType.BASIC,
    version: 1,
  };

  //   Create msg
  //   @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg };
};

it('creates user subscription', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();

  // Assertions to make sure subscription was created
  const subs = await UserSubscription.findById(data.id);
  expect(subs).toBeDefined();
  expect(subs!.id).toEqual(data.id);
});
