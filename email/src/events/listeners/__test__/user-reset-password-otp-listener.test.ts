import { UserResetPasswordOTPListener } from '../user-reset-pasword-otp-listener';
import { UserResetPasswordEvent } from '@theartisans/shared/build';
import { natsWrapper } from '../../../nats-wrapper';
import { Message } from 'node-nats-streaming';
jest.setTimeout(60000);

const setup = async () => {
  //  create listener instance
  const listener = new UserResetPasswordOTPListener(natsWrapper.client);

  // create fake event data
  const data: UserResetPasswordEvent['data'] = {
    userId: 'b7ekjaasdsaidlfkasdf3832493',
    email: 'devfelixphil@gmail.com',
    expiresIn: 300,
    otp: '638098',
    resetToken: 'A3asdoea4kd32343442',
  };

  // create msg instance
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg };
};

it('should send forgot password otp email to user', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
