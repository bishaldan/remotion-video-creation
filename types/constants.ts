import { z } from "zod";

// Original composition
export const COMP_NAME = "MyComp";

export const CompositionProps = z.object({
  title: z.string(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "Next.js and Remotion",
};

export const DURATION_IN_FRAMES = 200;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;

// Educational Video schemas
export const EDU_COMP_NAME = "EducationalVideo";

// Slide type schemas
export const TextSlideSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  animation: z.enum(["typewriter", "fadeIn", "wordByWord"]).default("fadeIn"),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(5),
});

export const BulletSlideSchema = z.object({
  type: z.literal("bullets"),
  title: z.string().optional(),
  bullets: z.array(z.string()),
  bulletIcon: z.string().optional(),
  titleColor: z.string().optional(),
  bulletColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(5),
});

export const DiagramNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  color: z.string().optional(),
});

export const DiagramArrowSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
});

export const DiagramSlideSchema = z.object({
  type: z.literal("diagram"),
  title: z.string().optional(),
  nodes: z.array(DiagramNodeSchema),
  arrows: z.array(DiagramArrowSchema),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(6),
});

export const ThreeDObjectSchema = z.object({
  shape: z.enum(["cube", "sphere", "pyramid", "torus", "cylinder"]),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  scale: z.number().default(1),
  color: z.string().default("#6366f1"),
  label: z.string().optional(),
  rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  showTrajectory: z.boolean().default(true),
  orbitSpeed: z.number().optional(),
  animation: z.enum(["none", "orbit", "pulse", "float", "rotate"]).default("none"),
});

export const ThreeDSlideSchema = z.object({
  type: z.literal("threeD"),
  title: z.string().optional(),
  objects: z.array(ThreeDObjectSchema).optional(),
  cameraPosition: z.tuple([z.number(), z.number(), z.number()]).optional(),
  // Keeping these for backward compatibility or simple slides
  shape: z.enum(["cube", "sphere", "pyramid", "torus", "cylinder"]).optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(5),
});

export const SlideSchema = z.discriminatedUnion("type", [
  TextSlideSchema,
  BulletSlideSchema,
  DiagramSlideSchema,
  ThreeDSlideSchema,
]);

export const TimelineSchema = z.object({
  title: z.string(),
  slides: z.array(SlideSchema),
  defaultSlideDuration: z.number().default(5),
});

export type Slide = z.infer<typeof SlideSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;

export const defaultEduCompProps: Timeline = {
  title: "Educational Video",
  defaultSlideDuration: 5,
  slides: [
    {
      type: "text",
      text: "Welcome to Educational Videos",
      animation: "wordByWord",
      durationInSeconds: 4,
    },
    {
      type: "bullets",
      title: "What You'll Learn",
      bullets: [
        "Create animated presentations",
        "Use dynamic templates",
        "Generate videos from prompts",
      ],
      durationInSeconds: 5,
    },
  ],
};

