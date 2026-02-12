import { z } from "zod";
import { IntroSlideSchema, OutroSlideSchema } from "./shared";

// Dual Quiz Mode
export const QuizQuestionSchema = z.object({
  type: z.literal("quiz"),
  question: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correctIndex: z.number(),
  backgroundQuery: z.string(),
  backgroundUrl: z.string().optional(),
  durationInSeconds: z.number().default(5),
  revealTimeSeconds: z.number().optional(),
  narrationUrl: z.string().optional(),
});

export const DualQuizTimelineSchema = z.object({
  title: z.string(),
  mode: z.literal("quiz"),
  orientation: z.enum(["landscape", "portrait"]),
  slides: z.array(z.discriminatedUnion("type", [
    QuizQuestionSchema,
    IntroSlideSchema,
    OutroSlideSchema,
  ])),
  defaultSlideDuration: z.number().default(7),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type QuizTimeline = z.infer<typeof DualQuizTimelineSchema>;

export const defaultDualQuizTimeline: QuizTimeline = {
  title: "Solar System Quiz",
  mode: "quiz",
  orientation: "landscape",
  defaultSlideDuration: 5,
  slides: [
    {
      type: "intro",
      title: "Solar System Quiz",
      subtitle: "Test your knowledge!",
      author: "Remotion Quiz",
      durationInSeconds: 5,
      narrationUrl: "/audio/solar-system-quiz-enhanced-v4_quiz_2026-02-11/slide-0.wav",
    },
    {
      type: "quiz",
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1,
      backgroundQuery: "Mars planet space",
      backgroundUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/1920px-OSIRIS_Mars_true_color.jpg",
      durationInSeconds: 13.5,
      narrationUrl: "/audio/solar-system-quiz-enhanced-v4_quiz_2026-02-11/slide-1.wav",
    },
    {
      type: "quiz",
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Jupiter", "Uranus", "Neptune"],
      correctIndex: 1,
      backgroundQuery: "Jupiter planet space",
      backgroundUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/1920px-Jupiter.jpg",
      durationInSeconds: 13.5,
      narrationUrl: "/audio/solar-system-quiz-enhanced-v4_quiz_2026-02-11/slide-2.wav",
    },
    {
      type: "outro",
      title: "Great Job!",
      callToAction: "Follow for more quizzes",
      durationInSeconds: 7,
      narrationUrl: "/audio/solar-system-quiz-enhanced-v4_quiz_2026-02-11/slide-3.wav",
    }
  ],
};

export const QUIZ_COMP_LANDSCAPE = "QuizVideoLandscape";
export const QUIZ_COMP_PORTRAIT = "QuizVideoPortrait";
export const QUIZ_WIDTH_LANDSCAPE = 1920;
export const QUIZ_HEIGHT_LANDSCAPE = 1080;
export const QUIZ_WIDTH_PORTRAIT = 1080;
export const QUIZ_HEIGHT_PORTRAIT = 1920;

// Single Quiz Mode
export const SingleQuizQuestionSchema = z.object({
  type: z.literal("singleQuiz"),
  question: z.string(),
  correctIndex: z.number(),
  options: z.array(z.string()),
  imageQuery: z.string(),
  imageUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().optional(),
  revealTimeSeconds: z.number().optional(),
  narrationUrl: z.string().optional(),
});

export const SingleQuizTimelineSchema = z.object({
  title: z.string(),
  mode: z.literal("singleQuiz"),
  slides: z.array(z.discriminatedUnion("type", [
    SingleQuizQuestionSchema,
    IntroSlideSchema,
    OutroSlideSchema,
  ])),
  defaultSlideDuration: z.number().default(10),
});

export type SingleQuizQuestion = z.infer<typeof SingleQuizQuestionSchema>;
export type SingleQuizTimeline = z.infer<typeof SingleQuizTimelineSchema>;

const SINGLE_QUIZ_COLORS = [
  "#c2185b", "#7b1fa2", "#1565c0", "#00838f", "#2e7d32", "#e65100", "#4527a0", "#00695c",
];

export const defaultSingleQuizTimeline: SingleQuizTimeline = {
  title: "General Knowledge Quiz",
  mode: "singleQuiz",
  defaultSlideDuration: 10,
  slides: [
    {
      type: "intro",
      title: "General Knowledge Quiz",
      subtitle: "How much do you know?",
      author: "QuizMaster",
      backgroundColor: "#1a1a2e",
      durationInSeconds: 5,
      narrationUrl: "/audio/official-single-quiz-v5_singleQuiz_2026-02-11/slide-0.wav",
    },
    {
      type: "singleQuiz",
      question: "Which part of the tooth is the hardest substance in the human body?",
      correctIndex: 0,
      options: ["Enamel", "Dentin", "Pulp", "Cementum"],
      imageQuery: "tooth enamel",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Blausen_0863_ToothAnatomy_02.png/800px-Blausen_0863_ToothAnatomy_02.png",
      backgroundColor: SINGLE_QUIZ_COLORS[0],
      durationInSeconds: 15.5,
      narrationUrl: "/audio/official-single-quiz-v5_singleQuiz_2026-02-11/slide-1.wav",
    },
    {
      type: "singleQuiz",
      question: "Which planet is the smallest in our solar system?",
      correctIndex: 1,
      options: ["Mars", "Mercury", "Venus", "Earth"],
      imageQuery: "Mercury planet",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Mercury_in_color_-_Prockter07-edit1.jpg/800px-Mercury_in_color_-_Prockter07-edit1.jpg",
      backgroundColor: SINGLE_QUIZ_COLORS[1],
      durationInSeconds: 14.5,
      narrationUrl: "/audio/official-single-quiz-v5_singleQuiz_2026-02-11/slide-2.wav",
    },
    {
      type: "outro",
      title: "Great Job!",
      callToAction: "How many did you get right? Share your score!",
      backgroundColor: "#1a1a2e",
      durationInSeconds: 5,
      narrationUrl: "/audio/official-single-quiz-v5_singleQuiz_2026-02-11/slide-3.wav",
    },
  ],
};

export const SINGLE_QUIZ_COMP = "SingleQuizVideo";
export const SINGLE_QUIZ_WIDTH = 1920;
export const SINGLE_QUIZ_HEIGHT = 1080;
