import { UserResetPasswordOTPListener } from "./events/listeners/user-reset-pasword-otp-listener";
import { UserSigninOTPListener } from "./events/listeners/user-signin-otp-listener";
import { UserSignupOTPListener } from "./events/listeners/user-signup-otp-listener";
import { UserPasswordChangedListener } from "./events/listeners/user-password-changed-listener";
import { natsWrapper } from "./nats-wrapper";
import { emailWrapper } from "./email-wrapper";

const PORT: number = 3000;

const start = async () => {
  console.log("Starting up......");

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error("NATS_CLIENT_ID env variable must be defined");
  }
  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL env variable must be defined");
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error("NATS_CLUSTER_ID env variable must be defined");
  }
  if (!process.env.EMAIL_API_KEY) {
    throw new Error("EMAIL_API_KEY env variable must be defined");
  }
  if (!process.env.EMAIL_DOMAIN) {
    throw new Error("EMAIL_DOMAIN env variable must be defined");
  }

  try {
    // NATS streaming server initialization

    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );
    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed!");
      process.exit();
    });
    // Closing NAT server on pod closed
    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());

    // Listen
    new UserSignupOTPListener(natsWrapper.client).listen();
    new UserSigninOTPListener(natsWrapper.client).listen();
    new UserResetPasswordOTPListener(natsWrapper.client).listen();
    new UserPasswordChangedListener(natsWrapper.client).listen();

    // Initialize Mailer
    emailWrapper.initializeMailer(
      process.env.EMAIL_API_KEY!,
      process.env.EMAIL_DOMAIN!,
      false
    );
  } catch (error) {
    console.error(error);
  }
};

start();
