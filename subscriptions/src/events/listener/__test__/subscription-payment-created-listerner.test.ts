import { SubscriptionPaymentCreatedListener } from '../subscription-payment-created-listener';
import {
  SubscriptionPaymentCreatedEvent,
  SubscriptionType,
} from '@theartisans/shared/build';
import { natsWrapper } from '../../../nats-wrapper';
import { UserSubscription } from '../../../models/user-subscriptions';
import { Message } from 'node-nats-streaming';
import mongoose from 'mongoose';

const setUp = async (create = false) => {
  // create a listener
  const listener = new SubscriptionPaymentCreatedListener(natsWrapper.client);
  let userSubscription: any;
  if (create) {
    userSubscription = UserSubscription.build({
      expiryDate: new Date(),
      userId: new mongoose.Types.ObjectId().toHexString(),
      subscriptionType: SubscriptionType.PRO,
      transactionId: new mongoose.Types.ObjectId().toHexString(),
    });
    await userSubscription.save();
  }

  // create fake data
  const data: SubscriptionPaymentCreatedEvent['data'] = {
    userId: create
      ? userSubscription!.userId
      : new mongoose.Types.ObjectId().toHexString(),
    amount: 50,
    email: 'devfelixphil@gmail.com',
    quantity: 2,
    subscriptionType: SubscriptionType.PREMIUM,
    transactionId: create
      ? userSubscription!.transactionId
      : new mongoose.Types.ObjectId().toHexString(),
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { userSubscription, listener, data, msg };
};

it('creates a new subscription for user', async () => {
  const { listener, msg, data } = await setUp(false);

  await listener.onMessage(data, msg);
  expect(msg.ack).toHaveBeenCalled();
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('updates a new subscription for user', async () => {
  const { listener, msg, data, userSubscription } = await setUp(true);

  await listener.onMessage(data, msg);

  // assert it was updated
  const latestUserSubs = await UserSubscription.findById(userSubscription.id);
  expect(latestUserSubs!.subscriptionType).toEqual(SubscriptionType.PREMIUM);

  //assert event was published
  expect(msg.ack).toHaveBeenCalled();
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
