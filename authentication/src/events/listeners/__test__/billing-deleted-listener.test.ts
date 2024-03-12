import { BillingDeletedListener } from '../billing-deleted-listener';
import { Message } from 'node-nats-streaming';
import { BillingDeletedEvent } from '@theartisans/shared/build';
import { natsWrapper } from '../../../nats-wrapper';
import mongoose from 'mongoose';
import { Billing } from '../../../models/billing';

const setup = async () => {
  // create listener instance
  const listener = new BillingDeletedListener(natsWrapper.client);

  // crate fake data
  const billing = Billing.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    cardNumber: '5531886652142950',
    cardExpiryMonth: '09',
    cardExpiryYear: '32',
    cardFullName: 'Felix Philips',
    cardToken: 'flw_mockdaldk5asflksdkaklafa',
  });
  await billing.save();
  const data: BillingDeletedEvent['data'] = {
    id: billing.id,
    email: 'devfelixphil@gmail.com',
    userId: billing.userId,
  };

  //   Create msg
  //   @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg, billing };
};

it('deletes user billing', async () => {
  const { listener, data, msg, billing } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();

  // Assertions to make sure billing was created
  const billings = await Billing.find({});
  expect(billings.length).toEqual(0);
});
