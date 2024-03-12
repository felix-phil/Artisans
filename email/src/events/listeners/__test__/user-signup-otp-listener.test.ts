import { UserSignupOTPListener } from '../user-signup-otp-listener';
import { UserSignupOTPEvent } from '@theartisans/shared/build';
import { natsWrapper } from '../../../nats-wrapper';
import { Message } from 'node-nats-streaming';
jest.setTimeout(60000);

const setup = async () => {
  //  create listener instance
  const listener = new UserSignupOTPListener(natsWrapper.client);

  // create fake event data
  const data: UserSignupOTPEvent['data'] = {
    userId: 'b7ekjaasdsaidlfkasdf3832493',
    email: 'devfelixphil@gmail.com',
    expiresIn: 300,
    otp: '638098',
  };

  // create msg instance
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg };
};

it('should send signup otp email to user', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
