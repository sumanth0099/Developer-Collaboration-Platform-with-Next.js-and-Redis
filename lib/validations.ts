import { z } from "zod";
import { DifficultyTag } from "@prisma/client";
import { SUPPORTED_LANGUAGES } from "./constants";

export const createSubmissionSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20).max(2000),
  codeContent: z.string().min(10).max(50000),
  language: z.enum(SUPPORTED_LANGUAGES),
  difficultyTag: z.nativeEnum(DifficultyTag),
  tagIds: z.array(z.string()).min(1).max(5),
});

export const createReviewSchema = z.object({
  submissionId: z.string().cuid(),
  content: z.string().min(30).max(5000),
  lineReference: z.number().int().positive().nullable().optional(),
  rating: z.number().int().min(1).max(5),
});
