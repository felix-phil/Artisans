import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../app";
import { natsWrapper } from "../nats-wrapper";
import { imageHandler } from "../image-handler";

jest.mock("../nats-wrapper");
jest.mock("../image-handler");

let mongod: any;

declare global {
  var signin: () => Promise<string[]>;
}
const VERIFY_PATH = "/authentication/api/v1/auth/verify";
const SIGNUP_PATH = "/authentication/api/v1/auth/signup";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

beforeAll(async () => {
  process.env.JWT_KEY = "testingKey";

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

global.signin = async (): Promise<string[]> => {
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);
  const signupEventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  const data = await request(app)
    .post(VERIFY_PATH)
    .send({ email: "devfelixphil@gmail.com", otp: signupEventData.otp })
    .expect(200);

  const cookie = data.get("Set-Cookie");
  return cookie;
};
