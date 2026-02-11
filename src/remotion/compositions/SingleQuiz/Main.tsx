import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { SingleQuizTimelineSchema } from "../../../../types/quiz";
import { VIDEO_FPS } from "../../../../types/shared";
import { IntroSlide } from "../../templates/IntroSlide";
import { OutroSlide } from "../../templates/OutroSlide";
import { SingleQuizSlide } from "../../templates/SingleQuizSlide";

// Transition duration in frames
const TRANSITION_DURATION = 15;

export const SingleQuizMain: React.FC<z.infer<typeof SingleQuizTimelineSchema>> = ({
  title,
  slides,
}) => {
  // Track question number (only count singleQuiz slides)
  let questionCounter = 0;

  const renderSlide = (slide: any, qNum: number) => {
    switch (slide.type) {
      case "intro":
        return (
          <IntroSlide
            title={slide.title}
            subtitle={slide.subtitle}
            author={slide.author}
            backgroundColor={slide.backgroundColor}
            narrationUrl={slide.narrationUrl}
          />
        );
      case "singleQuiz":
        return (
          <SingleQuizSlide
            question={slide.question}
            answer={slide.answer}
            options={slide.options}
            imageQuery={slide.imageQuery}
            imageUrl={slide.imageUrl}
            backgroundColor={slide.backgroundColor}
            durationInSeconds={slide.durationInSeconds}
            questionNumber={qNum}
            quizTitle={title}
            narrationUrl={slide.narrationUrl}
          />
        );
      case "outro":
        return (
          <OutroSlide
            title={slide.title}
            callToAction={slide.callToAction}
            backgroundColor={slide.backgroundColor}
            narrationUrl={slide.narrationUrl}
          />
        );
      default:
        console.warn("Unknown slide type:", slide);
        return (
          <AbsoluteFill style={{ backgroundColor: "red", justifyContent: "center", alignItems: "center" }}>
            <h1 style={{ color: "white" }}>Unknown Slide Type: {slide.type}</h1>
          </AbsoluteFill>
        );
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {slides.map((slide, index) => {
          const durationInSeconds = slide.durationInSeconds || 10;
          const durationInFrames = Math.round(durationInSeconds * VIDEO_FPS);

          // Increment question counter for singleQuiz slides
          if (slide.type === "singleQuiz") {
            questionCounter++;
          }
          const currentQNum = questionCounter;

          return (
            <React.Fragment key={index}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                {renderSlide(slide, currentQNum)}
              </TransitionSeries.Sequence>

              {/* Fade transitions between slides */}
              {index < slides.length - 1 && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const calculateSingleQuizDuration = (
  slides: any[],
  fps: number = VIDEO_FPS
): number => {
  const totalSlideFrames = slides.reduce((total, slide) => {
    const durationInSeconds = slide.durationInSeconds || 10;
    return total + Math.round(durationInSeconds * fps);
  }, 0);

  const transitionReduction = (slides.length - 1) * TRANSITION_DURATION;

  return Math.max(1, totalSlideFrames - transitionReduction);
};
