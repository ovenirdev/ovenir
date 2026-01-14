import { z } from 'zod';

/**
 * Supported tool categories
 */
export type ToolCategory =
  | 'encoding'
  | 'crypto'
  | 'json'
  | 'text'
  | 'time'
  | 'dev'
  | 'network'
  | 'image';

/**
 * Tool metadata - displayed in UI and used for SEO
 */
export interface ToolMeta {
  /** Unique identifier (kebab-case) */
  id: string;

  /** i18n key for the tool name */
  nameKey: string;

  /** i18n key for short description (< 160 chars for SEO) */
  descriptionKey: string;

  /** Tool category for filtering */
  category: ToolCategory;

  /** Search tags (English, used for Cmd+K search) */
  tags: string[];

  /** Related tool IDs (for "See also" section) */
  related?: string[];

  /** Tool icon name (from icon library) */
  icon: string;

  /** Is this tool stable? */
  status: 'stable' | 'beta' | 'experimental';

  /** Does this tool require network? (should be false for most tools) */
  requiresNetwork?: boolean;
}

/**
 * Tool definition - the complete tool package
 */
export interface Tool<TInput = unknown, TOutput = unknown> {
  /** Tool metadata */
  meta: ToolMeta;

  /** Zod schema for input validation */
  inputSchema: z.ZodSchema<TInput>;

  /** Zod schema for output validation */
  outputSchema: z.ZodSchema<TOutput>;

  /** Pure function that runs the tool */
  run: (input: TInput) => TOutput | Promise<TOutput>;
}

/**
 * Tool execution result
 */
export type ToolResult<TOutput = unknown> =
  | { success: true; data: TOutput }
  | { success: false; error: string };

/**
 * Tool runner - executes a tool safely
 */
export async function runTool<TInput, TOutput>(
  tool: Tool<TInput, TOutput>,
  rawInput: unknown
): Promise<ToolResult<TOutput>> {
  try {
    // Validate input
    const parseResult = tool.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: `Invalid input: ${parseResult.error.message}`,
      };
    }

    // Run the tool
    const output = await tool.run(parseResult.data);

    // Validate output
    const outputResult = tool.outputSchema.safeParse(output);
    if (!outputResult.success) {
      return {
        success: false,
        error: `Invalid output: ${outputResult.error.message}`,
      };
    }

    return { success: true, data: outputResult.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
