import { BillingCreatedListener } from '../billing-created-listener';
import { Message } from 'node-nats-streaming';
import { BillingCreatedEvent } from '@theartisans/shared/build';
import { natsWrapper } from '../../../nats-wrapper';
import mongoose from 'mongoose';
import { Billing } from '../../../models/billing';

const setup = async () => {
  // create listener instance
  const listener = new BillingCreatedListener(natsWrapper.client);

  // crate fake data
  const data: BillingCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'devfelixphil@gmail.com',
    userId: new mongoose.Types.ObjectId().toHexString(),
    cardNumber: '5531886652142950',
    cardExpiryMonth: '09',
    cardExpiryYear: '32',
    fullName: 'Felix Philips',
    cardToken: 'flw_mockdaldk5asflksdkaklafa',
  };

  //   Create msg
  //   @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg };
};

it('creates user billing', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();

  // Assertions to make sure billing was created
  const billing = await Billing.findById(data.id);
  expect(billing).toBeDefined();
  expect(billing!.id).toEqual(data.id);
});
