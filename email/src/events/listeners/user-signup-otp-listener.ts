import { Message } from 'node-nats-streaming';

import {
  Listener,
  Subjects,
  UserSignupOTPEvent,
} from '@theartisans/shared/build';
import { queueGroupName } from './queue-group-name';
import { emailWrapper } from '../../email-wrapper';

export class UserSignupOTPListener extends Listener<UserSignupOTPEvent> {
  subject: Subjects.UserSignupOTP = Subjects.UserSignupOTP;
  queueGroupName: string = queueGroupName;

  async onMessage(data: UserSignupOTPEvent['data'], msg: Message) {
    await emailWrapper.client.send({
      template: 'authentication/signup-otp',
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
