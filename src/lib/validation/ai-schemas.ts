/**
 * TDR-07: Input validation schemas for AI endpoints
 * Prevents invalid requests from consuming credits or causing errors
 */

import { z } from "zod";

// Valid time periods
const VALID_PERIODS = ["all", "1w", "1m", "3m", "6m", "1y"] as const;
const VALID_LOCALES = ["en", "pt"] as const;

// Shared schemas
export const UuidSchema = z.string().uuid().optional();
export const PeriodSchema = z.enum(VALID_PERIODS).default("all");
export const LocaleSchema = z.enum(VALID_LOCALES).default("en");
export const MessageSchema = z
  .string()
  .min(1, "Message cannot be empty")
  .max(2000, "Message too long")
  .trim();

// AI Copilot request
export const CopilotRequestSchema = z.object({
  message: MessageSchema,
  conversationId: z.string().uuid().optional().nullable(),
  importId: UuidSchema,
  accountId: UuidSchema,
  period: PeriodSchema,
  locale: LocaleSchema,
});

export type CopilotRequest = z.infer<typeof CopilotRequestSchema>;

// AI Insights request
export const InsightsRequestSchema = z.object({
  importId: UuidSchema,
  accountId: UuidSchema,
  period: PeriodSchema,
  locale: LocaleSchema,
});

export type InsightsRequest = z.infer<typeof InsightsRequestSchema>;

// AI Patterns request (same structure as insights)
export const PatternsRequestSchema = InsightsRequestSchema;
export type PatternsRequest = z.infer<typeof PatternsRequestSchema>;

// AI Risk request (same structure as insights)
export const RiskRequestSchema = InsightsRequestSchema;
export type RiskRequest = z.infer<typeof RiskRequestSchema>;

// AI Report Summary request
export const ReportSummaryRequestSchema = z.object({
  reportType: z.string().max(50).optional(),
  importId: UuidSchema,
  accountId: UuidSchema,
  period: PeriodSchema,
  locale: LocaleSchema,
});

export type ReportSummaryRequest = z.infer<typeof ReportSummaryRequestSchema>;

// AI TakerzScore request (same structure as insights)
export const TakerzScoreRequestSchema = InsightsRequestSchema;
export type TakerzScoreRequest = z.infer<typeof TakerzScoreRequestSchema>;

// Validate and parse request body safely
export function validateAiRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    // Format Zod errors
    const flattened = result.error.flatten();
    const errorMessages = Object.entries(flattened.fieldErrors)
      .map(([field, msgs]) => {
        if (Array.isArray(msgs)) {
          return `${field}: ${msgs.join(", ")}`;
        }
        return `${field}: Invalid`;
      })
      .join("; ");
    return { success: false, error: errorMessages || "Validation failed" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Validation failed" };
  }
}
