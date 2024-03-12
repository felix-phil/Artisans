import {
  Publisher,
  Subjects,
  UserResetPasswordEvent,
} from '@theartisans/shared/build';

export class UserResetPasswordPublisher extends Publisher<UserResetPasswordEvent> {
  subject: Subjects.UserResetPassword = Subjects.UserResetPassword;
}
