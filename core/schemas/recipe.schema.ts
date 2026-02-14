import { z } from 'zod';

export const RecipeBlockConfigSchema = z.object({
  blockId: z.string(),
  version: z.string().optional().default('latest'),
  port: z.number().optional(), // Override default port
  env: z.record(z.union([z.string(), z.number()])).optional(), // Inject ENV
  resources: z.object({
    memory: z.string().optional(),
  }).optional(),
});

export const RecipeSchema = z.object({
  recipeVersion: z.string().optional(),
  name: z.string(),
  blocks: z.record(RecipeBlockConfigSchema), // Key is the service name (e.g. "frontend")
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeBlockConfig = z.infer<typeof RecipeBlockConfigSchema>;
