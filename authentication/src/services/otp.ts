import { Hashing } from './hashing';
import otpGenerator from 'otp-generator';

export const OTPGenerate = async (length: number) => {
  const otp = otpGenerator.generate(length, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  const hashedOTP = await Hashing.toHash(otp);

  return { otp, hashedOTP };
};

export const verifyOTP = async (
  storedOTP: string,
  expiryDate: Date,
  OTP: string
): Promise<boolean> => {
  const nowTime = new Date();
  const otpMatches = await Hashing.compare(storedOTP, OTP);
  if (nowTime.getTime() > expiryDate.getTime() || !otpMatches) {
    return false;
  }
  return true;
};
