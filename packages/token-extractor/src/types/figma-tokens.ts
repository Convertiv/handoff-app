import { z } from 'zod';

// Figma Tokens Plugin JSON v2 format
export interface FigmaToken {
  value: string | number | Record<string, any>;
  type: string;
  description?: string;
}

export type FigmaTokenCategory = Record<string, FigmaToken | Record<string, FigmaToken>>;

export interface FigmaTokensJSON {
  $themes?: Array<{
    id: string;
    name: string;
    selectedTokenSets: Record<string, string>;
  }>;
  $metadata?: {
    tokenSetOrder?: string[];
  };
  [category: string]: FigmaTokenCategory | any;
}

// Zod schema for validation
const FigmaTokenSchema = z.object({
  value: z.union([z.string(), z.number(), z.record(z.any())]),
  type: z.string(),
  description: z.string().optional()
});

const FigmaTokensJSONSchema = z.record(
  z.union([
    FigmaTokenSchema,
    z.record(FigmaTokenSchema),
    z.any()
  ])
);

export function validateFigmaTokensJSON(json: unknown): FigmaTokensJSON {
  return FigmaTokensJSONSchema.parse(json) as FigmaTokensJSON;
}
