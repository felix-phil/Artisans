import {
  Publisher,
  Subjects,
  UserSignupOTPEvent,
} from '@theartisans/shared/build';

export class UserSignupOTPPublisher extends Publisher<UserSignupOTPEvent> {
  subject: Subjects.UserSignupOTP = Subjects.UserSignupOTP;
}
