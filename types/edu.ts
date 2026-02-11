import { z } from "zod";
import { IntroSlideSchema, OutroSlideSchema } from "./shared";

export const EDU_COMP_NAME = "EducationalVideo";

export const TextSlideSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  animation: z.enum(["typewriter", "fadeIn", "wordByWord"]).default("fadeIn"),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(5),
  narrationUrl: z.string().optional(),
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
  narrationUrl: z.string().optional(),
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
  narrationUrl: z.string().optional(),
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
  shape: z.enum(["cube", "sphere", "pyramid", "torus", "cylinder"]).optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(5),
  narrationUrl: z.string().optional(),
});

export const ImageSlideSchema = z.object({
  type: z.literal("image"),
  imageUrl: z.string(),
  imageQuery: z.string().optional(),
  caption: z.string().optional(),
  kenBurns: z.enum(["zoomIn", "zoomOut", "panLeft", "panRight", "none"]).default("zoomIn"),
  creditText: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(5),
  narrationUrl: z.string().optional(),
});

export const LottieSlideSchema = z.object({
  type: z.literal("lottie"),
  animationType: z.enum(["explaining", "thinking", "pointing", "celebrating", "writing", "presenting"]),
  animationUrl: z.string().optional(),
  text: z.string(),
  title: z.string().optional(),
  position: z.enum(["left", "right"]).default("left"),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(6),
  narrationUrl: z.string().optional(),
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
      narrationUrl: "/audio/test-education-slide-0.mp3",
    },
    {
      type: "lottie",
      animationType: "explaining",
      title: "Let's Learn Something New!",
      text: "This video uses AI-generated content with animated characters to make learning fun and engaging.",
      position: "left",
      durationInSeconds: 5,
      narrationUrl: "/audio/test-education-slide-1.mp3",
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
      narrationUrl: "/audio/test-education-slide-2.mp3",
    },
    {
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920",
      caption: "Powered by AI and beautiful visuals",
      kenBurns: "zoomIn",
      creditText: "Unsplash",
      durationInSeconds: 4,
      narrationUrl: "/audio/test-education-slide-3.mp3",
    },
    {
      type: "outro",
      title: "Thanks for Watching!",
      callToAction: "Created with Remotion SaaS",
      durationInSeconds: 5,
      narrationUrl: "/audio/test-education-slide-4.mp3",
    }
  ],
};
