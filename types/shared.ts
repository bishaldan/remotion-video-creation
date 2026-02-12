import { z } from "zod";

export const COMP_NAME = "MyComp";

export const CompositionProps = z.object({
  title: z.string(),
});

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;

export const IntroSlideSchema = z.object({
  type: z.literal("intro"),
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(6),
  narrationUrl: z.string().optional(),
});

export const OutroSlideSchema = z.object({
  type: z.literal("outro"),
  title: z.string().optional(),
  callToAction: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(6),
  narrationUrl: z.string().optional(),
});

export type IntroSlide = z.infer<typeof IntroSlideSchema>;
export type OutroSlide = z.infer<typeof OutroSlideSchema>;
