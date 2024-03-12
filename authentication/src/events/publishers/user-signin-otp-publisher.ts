import {
  Publisher,
  Subjects,
  UserSigninOTPEvent,
} from '@theartisans/shared/build';

export class UserSigninOTPPublisher extends Publisher<UserSigninOTPEvent> {
  subject: Subjects.UserSigninOTP = Subjects.UserSigninOTP;
}
