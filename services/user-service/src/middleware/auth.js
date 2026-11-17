import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

export async function authenticate(req, res, next) {
  const authorization = req.get("authorization");

  // 1. Check Authorization header
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authorization.slice(7);

  let payload;

  // 2. Verify JWT
  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: "fixnear-user-service",
      audience: "fixnear-api",
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // 3. Validate JWT payload
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.sub !== "string" ||
    !mongoose.isObjectIdOrHexString(payload.sub) ||
    !Number.isInteger(payload.iat)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid token payload",
    });
  }

  // 4. Verify user against database
  try {
    const user = await User.findById(payload.sub)
      .select("isActive passwordChangedAt role")
      .lean();

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 5. Invalidate tokens issued before password change
    if (
      user.passwordChangedAt &&
      payload.iat <= Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // 6. Attach authenticated user to request
    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
