import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    password: z.string().min(6).max(12),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(72),
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/i),
  })
  .strict();

export const resendVerificationSchema = z
  .object({
    email: z.string().trim().email().max(254),
  })
  .strict();
