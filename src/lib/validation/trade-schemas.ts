import { z } from "zod";

/**
 * Trade creation validation schema
 * Validates individual trade entry from form submission
 */
export const CreateTradeSchema = z.object({
  trade_date: z.string().date("Format: YYYY-MM-DD").describe("Trade date in YYYY-MM-DD format"),
  pair: z
    .string()
    .min(3, "Par must be at least 3 characters")
    .max(10, "Par must be at most 10 characters")
    .transform((val) => val.toUpperCase())
    .describe("Currency pair (e.g., EURUSD)"),
  entry_price: z.number().finite().describe("Entry price"),
  exit_price: z.number().finite().describe("Exit price"),
  pips: z.number().describe("Profit/loss in pips"),
  is_win: z.boolean().describe("Whether the trade was a win"),
  risk_reward: z.number().optional().nullable().describe("Risk/reward ratio (optional)"),
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .optional()
    .default([])
    .describe("Trade tags/labels"),
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or less")
    .optional()
    .nullable()
    .describe("Additional notes about the trade"),
});

export type CreateTradeInput = z.infer<typeof CreateTradeSchema>;

/**
 * Trade update validation schema (notes and tags only)
 */
export const UpdateTradeSchema = z.object({
  tradeId: z
    .string()
    .uuid("Invalid trade ID format")
    .describe("UUID of trade to update"),
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or less")
    .nullable()
    .describe("Trade notes"),
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .describe("Array of tags"),
});

export type UpdateTradeInput = z.infer<typeof UpdateTradeSchema>;

/**
 * Import trades validation schema
 * Validates file upload and import parameters
 */
export const ImportTradesSchema = z.object({
  file: z.instanceof(File).describe("File to import"),
  // Additional fields can be added if needed
});

export type ImportTradesInput = z.infer<typeof ImportTradesSchema>;

/**
 * Batch trade operations validation
 * For future use with bulk update/delete operations
 */
export const BatchTradesSchema = z.object({
  tradeIds: z
    .array(z.string().uuid())
    .min(1, "At least one trade ID required")
    .describe("Array of trade IDs to operate on"),
  operation: z
    .enum(["delete", "archive", "tag"])
    .describe("Bulk operation to perform"),
  tagToAdd: z
    .string()
    .optional()
    .describe("Tag to add (if operation is 'tag')"),
});

export type BatchTradesInput = z.infer<typeof BatchTradesSchema>;

/**
 * Validation helper to safely parse FormData into typed objects
 * Usage: const result = validateTradeFormData(formData);
 */
export function validateTradeFormData(formData: FormData): {
  success: boolean;
  data?: CreateTradeInput;
  error?: string;
} {
  try {
    const raw = {
      trade_date: formData.get("trade_date") as string,
      pair: formData.get("pair") as string,
      entry_price: Number(formData.get("entry_price")),
      exit_price: Number(formData.get("exit_price")),
      pips: Number(formData.get("pips")),
      is_win: formData.get("is_win") === "true",
      risk_reward: formData.get("risk_reward")
        ? Number(formData.get("risk_reward"))
        : undefined,
      tags: formData.get("tags")
        ? String(formData.get("tags"))
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      notes: formData.get("notes") as string | null,
    };

    const result = CreateTradeSchema.safeParse(raw);

    if (!result.success) {
      const errorMessages = result.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      return { success: false, error: errorMessages };
    }

    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: `Failed to parse form data: ${message}` };
  }
}
