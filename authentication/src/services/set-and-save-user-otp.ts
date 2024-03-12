import { UserDoc } from '../models/user';
import { OTPGenerate } from './otp';

export const OTP_EXPIRATION_SECONDS = 5 * 60; // 5 minutes
export const setAndSaveUserOTP = async (user: UserDoc) => {
  const { hashedOTP, otp } = await OTPGenerate(6);
  const hashedOTPExpirationDate = new Date();
  hashedOTPExpirationDate.setSeconds(
    hashedOTPExpirationDate.getSeconds() + OTP_EXPIRATION_SECONDS
  );

  user.set({
    hashedOTP: hashedOTP,
    hashedOTPExpirationDate: hashedOTPExpirationDate,
  });
  await user.save();
  return otp;
};
