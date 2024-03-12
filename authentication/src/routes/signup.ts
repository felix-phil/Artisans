import express, { Response, Request } from "express";
import { body } from "express-validator";
import {
  BadRequestError,
  validateRequest,
  UserRoles,
  PositiveResponseBody,
  createResponse,
} from "@theartisans/shared/build";
import { User } from "../models/user";
import {
  setAndSaveUserOTP,
  OTP_EXPIRATION_SECONDS,
} from "../services/set-and-save-user-otp";
import { natsWrapper } from "../nats-wrapper";
import { UserSignupOTPPublisher } from "../events/publishers/user-signup-otp-publisher";
const router = express.Router();

router.post(
  "/api/v1/auth/signup",
  [
    body("email").isEmail().withMessage("Email is Required!"),
    body("password")
      .trim()
      .isStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        "Password must be atleast 8 characters in length with atleast one symbol, uppercase and number"
      ),
  ],
  validateRequest,
  async (
    req: Request<{}, {}, { email: string; password: string }>,
    res: Response<PositiveResponseBody<{ email: string; active: boolean }>>
  ) => {
    const { email, password } = req.body;
    const userAgentDevice = req.get("User-Agent");
    const userExists = await User.findOne({ email });

    if (userExists) {
      throw new BadRequestError("Email provided is already in use");
    }
    if (!userAgentDevice) {
      throw new BadRequestError("Device not recognized");
    }
    const user = User.build({ email, password });

    user.devices.push(userAgentDevice);
    user.roles.push(UserRoles.Normal);
    const otp = await setAndSaveUserOTP(user);

    // Publish Email SignUp Event
    await new UserSignupOTPPublisher(natsWrapper.client).publish({
      userId: user.id,
      email: user.email,
      otp,
      expiresIn: OTP_EXPIRATION_SECONDS,
    });
    res.status(201).json(
      createResponse(
        {
          email: user.email,
          active: user.active,
        },
        201,
        "User created successfully, check email for OTP, OTP expires in 5 minutes"
      )
    );
  }
);
export { router as signUpRouter };
