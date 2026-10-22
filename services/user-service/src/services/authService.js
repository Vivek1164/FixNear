import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

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

  try {
    const user = await User.create({
      name: data.name,
      email,
      passwordHash,
      role: "customer",
    });

    return {
      user: toSafeUser(user),
      accessToken: createAccessToken(user),
    };
  } catch (error) {
    // The unique MongoDB index also protects against
    // two concurrent registrations for the same email.
    if (error.code === 11000) {
      throw new AppError(409, "Email is already registered");
    }

    throw error;
  }
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
