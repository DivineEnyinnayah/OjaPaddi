import { z } from "zod";

export const CreateExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be at least ₦0.01"),
  category: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  dueDate: z.string().optional(),
  isPaid: z.boolean().optional(),
  reminderDaysBefore: z.number().optional(),
  incurredAt: z.string().optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

export const ExpenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
