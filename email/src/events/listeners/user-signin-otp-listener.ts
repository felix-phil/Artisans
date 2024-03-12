import { Message } from 'node-nats-streaming';

import {
  Listener,
  Subjects,
  UserSigninOTPEvent,
} from '@theartisans/shared/build';
import { queueGroupName } from './queue-group-name';
import { emailWrapper } from '../../email-wrapper';

export class UserSigninOTPListener extends Listener<UserSigninOTPEvent> {
  subject: Subjects.UserSigninOTP = Subjects.UserSigninOTP;
  queueGroupName: string = queueGroupName;

  async onMessage(data: UserSigninOTPEvent['data'], msg: Message) {
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
