import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import {
  QuizTimelineSchema,
  VIDEO_FPS,
} from "../../../types/constants";
import { IntroSlide } from "../templates/IntroSlide";
import { OutroSlide } from "../templates/OutroSlide";
import { QuizSlide } from "../templates/QuizSlide";

// Transition duration in frames
const TRANSITION_DURATION = 15;

export const QuizMain: React.FC<z.infer<typeof QuizTimelineSchema>> = ({
  slides,
}) => {
  const renderSlide = (slide: any) => {
    // Debug logging
    // console.log("Rendering slide:", slide.type, slide);

    switch (slide.type) {
      case "intro":
        return (
          <IntroSlide
            title={slide.title}
            subtitle={slide.subtitle}
            author={slide.author}
            backgroundColor={slide.backgroundColor}
          />
        );
      case "quiz":
        return (
          <QuizSlide
            question={slide.question}
            options={slide.options}
            correctIndex={slide.correctIndex}
            backgroundUrl={slide.backgroundUrl}
            backgroundQuery={slide.backgroundQuery}
            durationInSeconds={slide.durationInSeconds}
          />
        );
      case "outro":
        return (
          <OutroSlide
            title={slide.title}
            callToAction={slide.callToAction}
            backgroundColor={slide.backgroundColor}
          />
        );
      default:
        console.warn("Unknown slide type:", slide);
        return (
            <AbsoluteFill style={{backgroundColor: 'red', justifyContent: 'center', alignItems: 'center'}}>
                <h1 style={{color: 'white'}}>Unknown Slide Type: {slide.type}</h1>
            </AbsoluteFill>
        );
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {slides.map((slide, index) => {
          const durationInSeconds = slide.durationInSeconds || 7;
          const durationInFrames = Math.round(durationInSeconds * VIDEO_FPS);

          return (
            <React.Fragment key={index}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                {renderSlide(slide)}
              </TransitionSeries.Sequence>
              
              {/* Add fade transitions between slides */}
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

export const calculateQuizDuration = (
  slides: any[],
  fps: number = VIDEO_FPS
): number => {
  const totalSlideFrames = slides.reduce((total, slide) => {
    const durationInSeconds = slide.durationInSeconds || 7;
    return total + Math.round(durationInSeconds * fps);
  }, 0);

  // Calculate transition frame reductions
  // In QuizMain, we use simple fade transitions between all slides
  const transitionReduction = (slides.length - 1) * TRANSITION_DURATION;

  return Math.max(1, totalSlideFrames - transitionReduction);
};
