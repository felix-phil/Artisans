import request from "supertest";
import { app } from "../../../../app";
import { SubscriptionType } from "@theartisans/shared/build";
import mongoose from "mongoose";
import { natsWrapper } from "../../../../nats-wrapper";
import { Billing } from "../../../../models/billing";
import { Subscription } from "../../../../models/subscriptions";

jest.setTimeout(60000);

const setUp = async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();

  // create billing fake data
  const billing = Billing.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    cardNumber: "5531886652142950",
    cardExpiryMonth: "09",
    cardExpiryYear: "32",
    cardToken: "flw-t1nf-53fdcf82357a7715d75c4b5cab2d3023-m03k",
    cardFullName: "Felix Philips",
  });
  await billing.save();
  //   create fake subscription plan data
  const subPlan = Subscription.build({
    benefits: ["I dont know", "I dont", "I"],
    name: SubscriptionType.PRO,
    price: 3,
  });
  await subPlan.save();

  return { billing, subPlan, userId };
};

it("successfully suscribes a user with billing details", async () => {
  const { billing, userId } = await setUp();
  await request(app)
    .post("/api/charges/payments/subscription/new")
    .set("Cookie", signin(false, userId, billing.id))
    .send({
      subscriptionType: "PRO",
      quantity: 1,
    })
    .expect(201);
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
