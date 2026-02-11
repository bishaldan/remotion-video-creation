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
      narrationUrl: "/audio/test-dual-quiz-slide-0.mp3",
    },
    {
      type: "quiz",
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1,
      backgroundQuery: "Mars planet space",
      backgroundUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/1920px-OSIRIS_Mars_true_color.jpg",
      durationInSeconds: 7,
      narrationUrl: "/audio/test-dual-quiz-slide-1.mp3",
    },
    {
      type: "quiz",
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Jupiter", "Uranus", "Neptune"],
      correctIndex: 1,
      backgroundQuery: "Jupiter planet space",
      backgroundUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/1920px-Jupiter.jpg",
      durationInSeconds: 7,
      narrationUrl: "/audio/test-dual-quiz-slide-2.mp3",
    },
    {
      type: "outro",
      title: "Great Job!",
      callToAction: "Follow for more quizzes",
      durationInSeconds: 5,
      narrationUrl: "/audio/test-dual-quiz-slide-3.mp3",
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
  answer: z.string(),
  options: z.array(z.string()).min(2).max(4),
  imageQuery: z.string(),
  imageUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  durationInSeconds: z.number().default(10),
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
      narrationUrl: "/audio/test-single-quiz-slide-0.mp3",
    },
    {
      type: "singleQuiz",
      question: "What is the outer layer of a tooth called?",
      answer: "Enamel",
      options: ["Dentin", "Enamel", "Pulp", "Cementum"],
      imageQuery: "tooth enamel",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Blausen_0863_ToothAnatomy_02.png/800px-Blausen_0863_ToothAnatomy_02.png",
      backgroundColor: SINGLE_QUIZ_COLORS[0],
      durationInSeconds: 10,
      narrationUrl: "/audio/test-single-quiz-slide-1.mp3",
    },
    {
      type: "singleQuiz",
      question: "Which planet is closest to the Sun?",
      answer: "Mercury",
      options: ["Venus", "Mercury", "Mars", "Earth"],
      imageQuery: "Mercury planet",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Mercury_in_color_-_Prockter07-edit1.jpg/800px-Mercury_in_color_-_Prockter07-edit1.jpg",
      backgroundColor: SINGLE_QUIZ_COLORS[1],
      durationInSeconds: 10,
      narrationUrl: "/audio/test-single-quiz-slide-2.mp3",
    },
    {
      type: "outro",
      title: "Great Job!",
      callToAction: "How many did you get right? Share your score!",
      backgroundColor: "#1a1a2e",
      durationInSeconds: 5,
      narrationUrl: "/audio/test-single-quiz-slide-3.mp3",
    },
  ],
};

export const SINGLE_QUIZ_COMP = "SingleQuizVideo";
export const SINGLE_QUIZ_WIDTH = 1920;
export const SINGLE_QUIZ_HEIGHT = 1080;
