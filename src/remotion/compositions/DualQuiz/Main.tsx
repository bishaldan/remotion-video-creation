/* eslint-disable @typescript-eslint/no-explicit-any */
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { DualQuizTimelineSchema } from "../../../../types/quiz";
import { VIDEO_FPS } from "../../../../types/shared";
import { IntroSlide } from "../../templates/IntroSlide";
import { OutroSlide } from "../../templates/OutroSlide";
import { DualQuizSlide } from "../../templates/QuizSlide";


// Transition duration in frames
const TRANSITION_DURATION = 15;

export const DualQuizMain: React.FC<z.infer<typeof DualQuizTimelineSchema>> = ({
  slides,
}) => {

  const renderSlide = (slide: any) => {
    // Debug logging
    // console.log(`[DualQuiz] Rendering slide: ${slide.type}`, JSON.stringify(slide, null, 2));

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
      case "dualQuiz":
        return (
          <DualQuizSlide
            question={slide.question}
            options={slide.options}
            correctIndex={slide.correctIndex}
            backgroundUrl={slide.backgroundUrl}
            backgroundQuery={slide.backgroundQuery}
            durationInSeconds={slide.durationInSeconds}
            revealTimeSeconds={slide.revealTimeSeconds}
            startFromSeconds={slide.startFromSeconds}
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
          <AbsoluteFill style={{ backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ color: 'white' }}>Unknown Slide Type: {slide.type}</h1>
          </AbsoluteFill>
        );
    }
  };

  // Calculate background music window (after intro, before outro)
  const introFrames = Math.round((slides[0]?.durationInSeconds || 5) * VIDEO_FPS);
  const outroFrames = Math.round((slides[slides.length - 1]?.durationInSeconds || 5) * VIDEO_FPS);
  const totalFrames = calculateQuizDuration(slides, VIDEO_FPS);
  const bgMusicFrom = introFrames - TRANSITION_DURATION;
  const bgMusicDuration = Math.max(1, totalFrames - bgMusicFrom - outroFrames + TRANSITION_DURATION);

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

      {/* Background music — plays between intro and outro */}
      <Sequence from={bgMusicFrom} durationInFrames={bgMusicDuration}>
        <Html5Audio src={staticFile("audio/sfx/bg/mysterious-background.mp3")} loop volume={0.15} />
      </Sequence>
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
