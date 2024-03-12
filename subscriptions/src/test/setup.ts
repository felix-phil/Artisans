import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { UserRoles, SubscriptionType } from '@theartisans/shared/build';

jest.mock('../nats-wrapper');

let mongod: any;

declare global {
  var signin: (superUser?: boolean) => string[];
}

beforeAll(async () => {
  process.env.JWT_KEY = 'testingKey';

  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

global.signin = (superUser = true): string[] => {
  // Build a JWT payload. {id, email}
  const id = new mongoose.Types.ObjectId().toHexString();

  const payload = {
    id: id,
    email: 'devfelixphil@gmail.com',
    roles: superUser ? Object.values(UserRoles) : [UserRoles.Normal],
    firstName: 'Felix',
    lastName: 'Philips',
    active: true,
    banned: false,
    subscription: {
      subscriptionType: SubscriptionType.PREMIUM,
      id: new mongoose.Types.ObjectId().toHexString(),
    },
    mobileNumber: '',
    loginCount: 2,
    lastLogin: new Date(),
    profileImageUrl: '',
  };
  // Create a JWT
  const token = jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: '2h' });

  // Build session Object. {jwt: myjwtklsd...}
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // encode the JSON as base64
  const base64EncodededJson = Buffer.from(sessionJSON).toString('base64');

  // return a cookie string with encoded data
  return [`session=${base64EncodededJson}`];
};
