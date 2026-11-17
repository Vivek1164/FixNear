import * as authService from "../services/authService.js";

export async function register(req, res) {
  const result = await authService.registerUser(req.validatedBody);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
}

export async function login(req, res) {
  const result = await authService.loginUser(req.validatedBody);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
}

export async function me(req, res) {
  const user = await authService.getUserById(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
}

export async function updateProfile(req, res) {
  const user = await authService.updateUserProfile(
    req.user.id,
    req.validatedBody,
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
}

export async function verifyEmail(req, res) {
  const result = await authService.verifyUserEmail(req.validatedBody.token);

  res.status(200).json({
    success: true,
    message: result.message,
  });
}

export async function resendVerification(req, res) {
  const result = await authService.resendVerificationEmail(
    req.validatedBody.email,
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
}

export async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.validatedBody.email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
}

export async function resetPassword(req, res) {
  const result = await authService.resetPassword(
    req.validatedBody.token,
    req.validatedBody.newPassword,
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
}
