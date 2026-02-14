import { z } from 'zod';

export const BlockManifestSchema = z.object({
  schemaVersion: z.string().optional(),
  id: z.string(),
  version: z.string(),
  type: z.enum(['frontend', 'backend', 'worker', 'database']),
  description: z.string().optional(),
  runCommand: z.string(), // Simple command for now, e.g. "npm start"
  scripts: z.record(z.string()).optional(), // Future proofing for lifecycle hooks
  env: z.record(z.object({
    description: z.string().optional(),
    required: z.boolean().optional(),
    default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  })).optional(),
  expose: z.object({
    port: z.object({
      default: z.number(),
      protocol: z.string().default('http'),
    }).optional(),
  }).optional(),
});

export type BlockManifest = z.infer<typeof BlockManifestSchema>;
