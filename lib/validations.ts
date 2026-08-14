import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const electionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["SINGLE_CHOICE", "MULTI_CHOICE"]),
  startDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: "Start date must be in the future",
  }),
  endDate: z.string(),
  candidates: z
    .array(
      z.object({
        name: z.string().min(1, "Candidate name is required"),
        description: z.string().optional(),
      })
    )
    .min(2, "At least 2 candidates are required"),
});

export const voteSchema = z.object({
  electionId: z.string().min(1, "Election ID is required"),
  candidateIndex: z.number().int().min(0, "Invalid candidate selection"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ElectionInput = z.infer<typeof electionSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
