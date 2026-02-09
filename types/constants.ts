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

// NEW: Image slide schema
export const ImageSlideSchema = z.object({
  type: z.literal("image"),
  imageUrl: z.string(), // Direct URL or will be resolved from imageQuery
  imageQuery: z.string().optional(), // Keyword for Unsplash search
  caption: z.string().optional(),
  kenBurns: z.enum(["zoomIn", "zoomOut", "panLeft", "panRight", "none"]).default("zoomIn"),
  creditText: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(5),
});

// NEW: Lottie animation slide schema
export const LottieSlideSchema = z.object({
  type: z.literal("lottie"),
  animationType: z.enum(["explaining", "thinking", "pointing", "celebrating", "writing", "presenting"]),
  animationUrl: z.string().optional(), // Override with custom Lottie URL
  text: z.string(),
  title: z.string().optional(),
  position: z.enum(["left", "right"]).default("left"),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(6),
});

// NEW: Intro slide schema
export const IntroSlideSchema = z.object({
  type: z.literal("intro"),
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(6),
});

// NEW: Outro slide schema
export const OutroSlideSchema = z.object({
  type: z.literal("outro"),
  title: z.string().optional(),
  callToAction: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(6),
});

export const SlideSchema = z.discriminatedUnion("type", [
  TextSlideSchema,
  BulletSlideSchema,
  DiagramSlideSchema,
  ThreeDSlideSchema,
  ImageSlideSchema,
  LottieSlideSchema,
  IntroSlideSchema,
  OutroSlideSchema,
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
      type: "intro",
      title: "The Wonder of Learning",
      subtitle: "Exploring New Horizons with AI",
      author: "Remotion Series",
      durationInSeconds: 5,
    },
    {
      type: "lottie",
      animationType: "explaining",
      title: "Let's Learn Something New!",
      text: "This video uses AI-generated content with animated characters to make learning fun and engaging.",
      position: "left",
      durationInSeconds: 5,
    },
    {
      type: "bullets",
      title: "What You'll Learn",
      bullets: [
        "Create animated presentations with **rich visuals**",
        "Use dynamic templates with **transitions**",
        "Generate videos from prompts using **AI**",
        "Add images and **Lottie animations**",
      ],
      durationInSeconds: 4,
    },
    {
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920",
      caption: "Powered by AI and beautiful visuals",
      kenBurns: "zoomIn",
      creditText: "Unsplash",
      durationInSeconds: 4,
    },
    {
      type: "outro",
      title: "Thanks for Watching!",
      callToAction: "Created with Remotion SaaS",
      durationInSeconds: 5,
    }
  ],
};

export const defaultEduCompProps2: Timeline = {
  title: "Educational Video",
  defaultSlideDuration: 5,
  slides: [
     {
      type: "lottie",
      animationType: "explaining",
      title: "Let's Learn Something New!",
      text: "Explaining",
      position: "left",
      durationInSeconds: 3,
    },
    {
      type: "lottie",
      animationType: "thinking",
      title: "Let's Learn Something New!",
      text: "Thinking",
      position: "left",
      durationInSeconds: 5,
    },
    {
      type: "lottie",
      animationType: "pointing",
      title: "Let's Learn Something New!",
      text: " Pointing",
      position: "left",
      durationInSeconds: 3,
    },
    {
      type: "lottie",
      animationType: "celebrating",
      title: "Let's Learn Something New!",
      text: "Celebrating",
      position: "left",
      durationInSeconds: 3,
    },
    {
      type: "lottie",
      animationType: "writing",
      title: "Let's Learn Something New!",
      text: "Writing",
      position: "left",
      durationInSeconds: 3,
    },
    {
      type: "lottie",
      animationType: "presenting",
      title: "Let's Learn Something New!",
      text: "Presenting",
      position: "left",
      durationInSeconds: 2,
    },
  ],
};


