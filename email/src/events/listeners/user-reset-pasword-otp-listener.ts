import { Message } from 'node-nats-streaming';

import {
  Listener,
  Subjects,
  UserResetPasswordEvent,
} from '@theartisans/shared/build';
import { queueGroupName } from './queue-group-name';
import { emailWrapper } from '../../email-wrapper';

export class UserResetPasswordOTPListener extends Listener<UserResetPasswordEvent> {
  subject: Subjects.UserResetPassword = Subjects.UserResetPassword;
  queueGroupName: string = queueGroupName;

  async onMessage(data: UserResetPasswordEvent['data'], msg: Message) {
    await emailWrapper.client.send({
      template: 'authentication/signin-otp',
      message: {
        from: 'Artisans <no-reply@theartisans.com>',
        to: data.email,
      },
      locals: {
        otp: data.otp,
        minutesToExpire: data.expiresIn / 60,
        email: data.email,
      },
    });

    // acknowledge message
    msg.ack();
  }
}
