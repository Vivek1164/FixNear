import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { sendVerificationEmail } from "../config/email.js";
import {
  createVerificationToken,
  hashVerificationToken,
} from "../utils/verificationToken.js";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

function createAccessToken(user) {
  return jwt.sign({ role: user.role }, process.env.JWT_ACCESS_SECRET, {
    subject: user._id.toString(),
    expiresIn: ACCESS_EXPIRES_IN,
    issuer: "fixnear-user-service",
    audience: "fixnear-api",
  });
}

function toSafeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function registerUser(data) {
  const email = data.email.toLowerCase().trim();

  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new AppError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const { token, tokenHash, expiresAt } = createVerificationToken();

  let user;

  try {
    user = await User.create({
      name: data.name,
      email,
      passwordHash,
      role: "customer",
      emailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, "Email is already registered");
    }

    throw error;
  }
  console.log("user", user);

  try {
    await sendVerificationEmail(user.email, token);
  } catch (error) {
    console.error("Verification email delivery failed");

    // Keep the account unverified. The user can request
    // another verification email.
    throw new AppError(
      503,
      "Account created, but email delivery failed. Please request a new verification email.",
    );
  }

  console.log("Verification email sent");

  return {
    message: "Account created. Please verify your email before logging in.",
  };
}

export async function loginUser(data) {
  const email = data.email.toLowerCase().trim();

  const user = await User.findOne({ email }).select("+passwordHash");

  // Use the same message for unknown email and bad password.
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.passwordHash,
  );

  if (!passwordMatches || !user.isActive) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.emailVerified !== true) {
    throw new AppError(403, "Please verify your email before logging in");
  }

  return {
    user: toSafeUser(user),
    accessToken: createAccessToken(user),
  };
}

export async function getUserById(userId) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError(404, "User not found");
  }

  return toSafeUser(user);
}

export async function updateUserProfile(userId, data) {
  const user = await User.findOneAndUpdate(
    { _id: userId, isActive: true },
    { $set: { name: data.name } },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return toSafeUser(user);
}

export async function verifyUserEmail(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError(400, "Invalid or expired verification token");
  }

  const tokenHash = hashVerificationToken(token);

  const user = await User.findOneAndUpdate(
    {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
      emailVerified: false,
    },
    {
      $set: { emailVerified: true },
      $unset: {
        emailVerificationTokenHash: 1,
        emailVerificationExpiresAt: 1,
      },
    },
    {
      new: true,
    },
  );

  if (!user) {
    throw new AppError(400, "Invalid or expired verification token");
  }

  return {
    message: "Email verified successfully. You can now log in.",
  };
}

export async function resendVerificationEmail(emailInput) {
  const email = emailInput.toLowerCase().trim();

  const user = await User.findOne({ email }).select(
    "+emailVerificationTokenHash +emailVerificationExpiresAt",
  );

  // Return the same public result for unknown, verified,
  // or successfully processed accounts.
  const response = {
    message: "If the account requires verification, an email will be sent.",
  };

  if (!user || user.emailVerified) {
    return response;
  }

  const { token, tokenHash, expiresAt } = createVerificationToken();

  // Replace the previous token before sending the new email.
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = expiresAt;

  await user.save();

  try {
    await sendVerificationEmail(user.email, token);
  } catch (error) {
    console.error("Verification email delivery failed");
    throw new AppError(
      503,
      "Unable to send verification email. Try again later.",
    );
  }

  return response;
}
