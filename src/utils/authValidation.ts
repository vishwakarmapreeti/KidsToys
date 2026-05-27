import { z } from 'zod';

// ─── ADDRESS SCHEMA ─────────────────────────────────────────
const addressSchema = z.object({
  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  pincode: z.string().optional().default(''),
  country: z.string().optional().default('India'),
});

// ─── REGISTER SCHEMA ────────────────────────────────────────
export const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, '❌ Name must be at least 2 characters')
      .max(50, '❌ Name must be less than 50 characters'),
    email: z.string()
      .email('❌ Invalid email address'),
    password: z.string()
      .min(6, '❌ Password must be at least 6 characters')
      .max(100, '❌ Password must be less than 100 characters'),
    phone: z.string()
      .regex(/^[0-9]{10}$/, '❌ Phone must be a valid 10-digit number'),
    address: addressSchema.optional(),
    adminSecret: z.string().optional(),
  }),
});

// ─── LOGIN SCHEMA ──────────────────────────────────────────
export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('❌ Invalid email address'),
    password: z.string()
      .min(1, '❌ Password is required'),
  }),
});

// ─── FORGOT PASSWORD SCHEMA ────────────────────────────────
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string()
      .email('❌ Invalid email address'),
  }),
});

// ─── RESET PASSWORD SCHEMA ────────────────────────────────
export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string()
      .min(1, '❌ Reset token is required'),
  }),
  body: z.object({
    password: z.string()
      .min(6, '❌ Password must be at least 6 characters')
      .max(100, '❌ Password must be less than 100 characters'),
  }),
});

// ─── VERIFY EMAIL SCHEMA ───────────────────────────────────
export const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string()
      .min(1, '❌ Verification token is required'),
  }),
});

// Export types for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
