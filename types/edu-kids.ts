import { z } from "zod";
import { IntroSlideSchema, OutroSlideSchema } from "./shared";

// ─────────────────────────────────────────────────────────────────
// Education Mode 2 — Kids Educational Content
// Portrait-first (1080×1920), kid-friendly content with cycling backgrounds
// ─────────────────────────────────────────────────────────────────

export const EDU_KIDS_COMP_NAME = "EducationKidsVideo";
export const EDU_KIDS_WIDTH = 1080;
export const EDU_KIDS_HEIGHT = 1920;

/**
 * Each "kidsContent" slide represents one continuous narration segment.
 * - `lines`: short text lines shown 1-2 at a time on screen
 * - `backgroundImageQueries`: 8-9 kid-friendly search keywords
 * - `backgroundImageUrls`: resolved image URLs (filled by setImagesUrl)
 * - Every ~2 seconds, background image transitions (slide in/out from top or bottom)
 * - Words are highlighted as they are spoken (TikTok-style)
 */
export const KidsContentSlideSchema = z.object({
    type: z.literal("kidsContent"),
    lines: z.array(z.string()),
    backgroundImageQueries: z.array(z.string()).min(6).max(30),
    backgroundImageUrls: z.array(z.string()).optional(),
    durationInSeconds: z.number().default(20),
    narrationUrl: z.string().optional(),
});

export const KidsSlideSchema = z.discriminatedUnion("type", [
    KidsContentSlideSchema,
    IntroSlideSchema,
    OutroSlideSchema,
]);

export const KidsTimelineSchema = z.object({
    title: z.string(),
    mode: z.literal("educationKids"),
    slides: z.array(KidsSlideSchema),
    defaultSlideDuration: z.number().default(20),
});

export type KidsContentSlide = z.infer<typeof KidsContentSlideSchema>;
export type KidsSlide = z.infer<typeof KidsSlideSchema>;
export type KidsTimeline = z.infer<typeof KidsTimelineSchema>;

export const defaultKidsTimeline: KidsTimeline = {
    title: "Fun Facts About Animals",
    mode: "educationKids",
    defaultSlideDuration: 20,
    slides: [
        {
            type: "intro",
            title: "Fun Facts About Animals! 🐾",
            subtitle: "Let's Learn Together!",
            author: "Kids Learning",
            backgroundColor: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
            durationInSeconds: 6,
            narrationUrl: "/audio/default/typecast-default/2026-02-17/Walter/default-kids-content/slide-0.wav"
        },
        {
            type: "kidsContent",
            lines: [
                "Did you know?",
                "Dolphins are super smart!",
                "They talk to each other",
                "using clicks and whistles.",
                "Elephants never forget.",
                "They have amazing memory!",
                "A group of flamingos",
                "is called a flamboyance!",
                "Octopuses have three hearts.",
                "How cool is that?",
            ],
            backgroundImageQueries: [
                "cute dolphin",
                "baby elephant",
                "pink flamingo",
                "colorful octopus",
                "happy puppy",
                "tropical fish",
                "butterfly garden",
                "rainbow nature",
                "cute panda",
            ],
            backgroundImageUrls: [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Olifant_%284149771763%29.jpg/1920px-Olifant_%284149771763%29.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Tropical_fish.jpg/1920px-Tropical_fish.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/8/82/American_homes_and_gardens_%281908%29_%2818151902362%29.jpg"
            ],
            durationInSeconds: 19,
            narrationUrl: "/audio/default/typecast-default/2026-02-17/Walter/default-kids-content/slide-1.wav"
        },
        {
            type: "outro",
            title: "Great Job Learning! 🌟",
            callToAction: "Follow for more fun facts!",
            backgroundColor: "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)",
            durationInSeconds: 5.5,
            narrationUrl: "/audio/default/typecast-default/2026-02-17/Walter/default-kids-content/slide-2.wav"
        },
    ],
};
