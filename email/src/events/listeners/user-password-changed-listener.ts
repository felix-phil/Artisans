import { Message } from 'node-nats-streaming';

import {
  Listener,
  Subjects,
  UserPassworChangedEvent,
} from '@theartisans/shared/build';

import { queueGroupName } from './queue-group-name';
import { emailWrapper } from '../../email-wrapper';

export class UserPasswordChangedListener extends Listener<UserPassworChangedEvent> {
  subject: Subjects.UserPasswordChanged = Subjects.UserPasswordChanged;
  queueGroupName: string = queueGroupName;

  async onMessage(data: UserPassworChangedEvent['data'], msg: Message) {
    await emailWrapper.client.send({
      template: 'authentication/password-changed',
      message: {
        from: 'Artisans <no-reply@theartisans.com>',
        to: data.email,
      },
      locals: {
        email: data.email,
      },
    });

    // acknowledge message
    msg.ack();
  }
}
