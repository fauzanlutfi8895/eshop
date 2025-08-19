import crypto from "crypto";
import { ValidationError } from "@packages/error-handler";
import { NextFunction } from "express";
import redis from "@packages/libs/redis";
import { sendEmail } from "./mail";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateRegistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError(`Missing required fields`);
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError(`Invalid email format!`);
  }
};

export const checkOtpRestriction = async (
  email: string,
  next: NextFunction
) => {
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        "Account locked due to multiple failed attempts! Try again after 30 minutes"
      )
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        "Too many OTP request! Please wait 1 hour requesting again"
      )
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError("Please wait 1 minute before requesting a new OTP!")
    );
  }
};

export const trackOtpRequest = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequest = parseInt((await redis.get(otpRequestKey)) || "0");

  if (otpRequest >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); //Locked for 1 hour
    return next(
      new ValidationError(
        "Too many OTP requests. Please wait 1 hour before requesting again"
      )
    );
  }

  await redis.set(otpRequestKey, otpRequest + 1, "EX", 3600); //Track request for 1 hour
};

export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = crypto.randomInt(1000, 9999).toString();

  sendEmail(email, "Verify Your Email", template, { name, otp });
  //Set Otp in redis (secondary database)
  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};

export const verifyOtp = async(email: string, otp: string, next: NextFunction) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if(!storedOtp){
    return next(new ValidationError("Invalid or expired OTP"))
  }

  const failedAttempsKey = `otp_attempts:${email}`
  const failedAttemps = parseInt(await redis.get(failedAttempsKey) || "0")

  if(storedOtp !== otp){
    if(failedAttemps >= 2){
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
      await redis.del(`otp:${email}`, failedAttempsKey);
      return next(new ValidationError("Too many failed attempts. Your account is locked for 30 minutes!"))
    }

    await redis.set(failedAttempsKey, failedAttemps + 1, "EX", 300);
    return next(new ValidationError(`Incorrect OTP. ${2 - failedAttemps} attempts left.`))
  }

  await redis.del(`otp:${email}`, failedAttempsKey)
}
