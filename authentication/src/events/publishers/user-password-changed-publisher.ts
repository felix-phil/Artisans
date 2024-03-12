import {
  Publisher,
  UserPassworChangedEvent,
  Subjects,
} from '@theartisans/shared/build';

export class UserPasswordChangedPublisher extends Publisher<UserPassworChangedEvent> {
  subject: Subjects.UserPasswordChanged = Subjects.UserPasswordChanged;
}
