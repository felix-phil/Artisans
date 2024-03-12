import express, { Response, Request } from "express";
import { body } from "express-validator";
import {
  BadRequestError,
  PositiveResponseBody,
  validateRequest,
} from "@theartisans/shared/build";
import { User } from "../models/user";
import { Hashing } from "../services/hashing";
import { signUser } from "../services/sign-user";
import {
  setAndSaveUserOTP,
  OTP_EXPIRATION_SECONDS,
} from "../services/set-and-save-user-otp";
import { natsWrapper } from "../nats-wrapper";
import { UserSigninOTPPublisher } from "../events/publishers/user-signin-otp-publisher";
const router = express.Router();

router.post(
  "/api/v1/auth/signin",
  [
    body("email").notEmpty().withMessage("Email is Required!"),
    body("password").notEmpty().withMessage("Password is required!"),
  ],
  validateRequest,
  async (
    req: Request<
      {},
      {},
      { rememberDevice: boolean; password: string; email: string }
    >,
    res: Response<PositiveResponseBody<any>>
  ) => {
    const { email, password, rememberDevice } = req.body;
    const userAgentDevice = req.get("User-Agent");

    const user = await User.findOne({ email });

    if (!userAgentDevice) {
      throw new BadRequestError("Device not recognized");
    }
    if (!user) {
      throw new BadRequestError("Invalid login credentials");
    }
    const passwordMatches = await Hashing.compare(user.password, password);

    if (!passwordMatches) {
      throw new BadRequestError("Invalid login credentials");
    }
    if (user.banned) {
      throw new BadRequestError(
        "Your account has been banned, please contact the support team"
      );
    }
    const deviceIsRecognized = user.devices.includes(userAgentDevice);

    if (deviceIsRecognized && user.active) {
      await signUser(req, user);
      return res.status(200).send({
        statusCode: 200,
        data: { otpSent: false, user: user },
        message: "Sign in successful",
      });
    }
    if (rememberDevice) {
      user.devices.push(userAgentDevice);
    }
    const otp = await setAndSaveUserOTP(user);

    // Publish Email SignIn Event
    await new UserSigninOTPPublisher(natsWrapper.client).publish({
      userId: user.id,
      email: user.email,
      otp,
      expiresIn: OTP_EXPIRATION_SECONDS,
    });
    res.status(200).send({
      statusCode: 200,
      data: {
        otpSent: true,
        user: {
          email: user.email,
          active: user.active,
        },
      },
      message:
        "This device is not recognized, check your mail for OTP verification",
    });
  }
);
export { router as signInRouter };
