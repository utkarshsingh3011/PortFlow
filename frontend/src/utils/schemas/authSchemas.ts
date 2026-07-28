import { z } from 'zod';

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const customerRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  businessName: z
    .string()
    .min(1, 'Business / Company name is required')
    .min(2, 'Business name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  gstin: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() ? val.trim().toUpperCase() : undefined))
    .refine((val) => !val || GSTIN_REGEX.test(val), {
      message: 'Must be a valid 15-character GSTIN (e.g., 22AAAAA0000A1Z5)',
    }),
  customerType: z.string().optional(),
});

export type CustomerRegistrationFormData = z.infer<typeof customerRegistrationSchema>;
