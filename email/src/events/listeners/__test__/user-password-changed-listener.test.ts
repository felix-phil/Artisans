import { UserPasswordChangedListener } from '../user-password-changed-listener';
import { UserPassworChangedEvent } from '@theartisans/shared/build';
import { natsWrapper } from '../../../nats-wrapper';
import { Message } from 'node-nats-streaming';
jest.setTimeout(60000);

const setup = async () => {
  //  create listener instance
  const listener = new UserPasswordChangedListener(natsWrapper.client);

  // create fake event data
  const data: UserPassworChangedEvent['data'] = {
    userId: 'b7ekjaasdsaidlfkasdf3832493',
    email: 'devfelixphil@gmail.com',
  };

  // create msg instance
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  return { listener, data, msg };
};

it('should send password changed email', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
