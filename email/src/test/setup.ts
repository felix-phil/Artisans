jest.mock('../nats-wrapper');
jest.mock('../email-wrapper'); // comment this line to do a live mailtrap testing
import { emailWrapper } from '../email-wrapper';
beforeAll(() => {
  // SET MAIL ENVs
  process.env.EMAIL_HOST = 'smtp.mailtrap.io';
  process.env.EMAIL_PORT = '2525';
  process.env.EMAIL_AUTH_USER = '6aabfab13e83f5';
  process.env.EMAIL_AUTH_PASS = 'bd2cb91e08e9fe';

  // emailWrapper.initializeMailer(   // uncomment this line to do a live mailtrap testing
  //   process.env.EMAIL_HOST,
  //   parseInt(process.env.EMAIL_PORT),
  //   process.env.EMAIL_AUTH_USER,
  //   process.env.EMAIL_AUTH_PASS
  // );
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

// afterAll(() => {});
