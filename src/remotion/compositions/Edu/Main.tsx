import { LightLeak } from "@remotion/light-leaks";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { TimelineSchema, type Slide } from "../../../../types/edu";
import { VIDEO_FPS } from "../../../../types/shared";
import { BulletSlide } from "../../templates/BulletSlide";
import { DiagramSlide } from "../../templates/DiagramSlide";
import { ImageSlide } from "../../templates/ImageSlide";
import { IntroSlide } from "../../templates/IntroSlide";
import { LottieSlide } from "../../templates/LottieSlide";
import { OutroSlide } from "../../templates/OutroSlide";
import { TextSlide } from "../../templates/TextSlide";
import { ThreeDSlide } from "../../templates/ThreeDSlide";

// Transition duration in frames (0.5 seconds at 30fps = 15 frames)
const TRANSITION_DURATION = 15;
// Light leak overlay duration (1 second = 30 frames)
const LIGHT_LEAK_DURATION = 30;

export const EduMain: React.FC<z.infer<typeof TimelineSchema>> = ({
  slides,
}) => {
  const renderSlide = (slide: Slide) => {
    switch (slide.type) {
      case "text":
        return (
          <TextSlide
            text={slide.text}
            animation={slide.animation}
            fontSize={slide.fontSize}
            color={slide.color}
            backgroundColor={slide.backgroundColor}
            narrationUrl={slide.narrationUrl}
          />
        );
      case "bullets":
        return (
          <BulletSlide
            title={slide.title}
            bullets={slide.bullets}
            bulletIcon={slide.bulletIcon}
            titleColor={slide.titleColor}
            bulletColor={slide.bulletColor}
            backgroundColor={slide.backgroundColor}
            narrationUrl={slide.narrationUrl}
          />
        );
      case "diagram":
        return (
          <DiagramSlide
            title={slide.title}
            nodes={slide.nodes}
            arrows={slide.arrows}
            backgroundColor={slide.backgroundColor}
            narrationUrl={slide.narrationUrl}
          />
        );
      case "threeD":
        return (
          <ThreeDSlide
            title={slide.title}
            objects={slide.objects}
            cameraPosition={slide.cameraPosition}
            shape={slide.shape}
            color={slide.color}
            backgroundColor={slide.backgroundColor}
            narrationUrl={slide.narrationUrl}
          />
        );
      case "image":
        return (
          <ImageSlide
            imageUrl={slide.imageUrl}
            caption={slide.caption}
            kenBurns={slide.kenBurns}
            creditText={slide.creditText}
            backgroundColor={slide.backgroundColor}
            narrationUrl={slide.narrationUrl}
          />
        );
      case "lottie":
        return (
          <LottieSlide
            animationType={slide.animationType}
            animationUrl={slide.animationUrl}
            text={slide.text}
            title={slide.title}
            position={slide.position}
            backgroundColor={slide.backgroundColor}
            narrationUrl={slide.narrationUrl}
          />
        );
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
        return null;
    }
  };

  // Determine which transitions should have light leaks (every 2nd or 3rd transition)
  const shouldHaveLightLeak = (index: number): boolean => {
    // Add light leak every 2 slides for visual interest
    return index % 2 === 0;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f0f1a" }}>
      <TransitionSeries>
        {slides.map((slide, index) => {
          const durationInSeconds = slide.durationInSeconds || 5;
          const durationInFrames = Math.round(durationInSeconds * VIDEO_FPS);
          const addLightLeak = shouldHaveLightLeak(index) && index < slides.length - 1;

          return (
            <React.Fragment key={index}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                {renderSlide(slide)}
              </TransitionSeries.Sequence>
              
              {/* Add transitions between slides */}
              {index < slides.length - 1 && (
                <>
                  {/* Light leak overlay on selected transitions */}
                  {addLightLeak && (
                    <TransitionSeries.Overlay durationInFrames={LIGHT_LEAK_DURATION}>
                      <LightLeak seed={index} hueShift={(index * 60) % 360} />
                    </TransitionSeries.Overlay>
                  )}
                  
                  {/* Fade transition (only if no light leak, as they can't be adjacent) */}
                  {!addLightLeak && (
                    <TransitionSeries.Transition
                      presentation={fade()}
                      timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
                    />
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// Helper function to calculate total duration of a timeline
// Note: With TransitionSeries, transitions OVERLAP, reducing total duration
export const calculateTimelineDuration = (
  slides: Slide[],
  fps: number = VIDEO_FPS
): number => {
  const totalSlideFrames = slides.reduce((total, slide) => {
    const durationInSeconds = slide.durationInSeconds || 5;
    return total + Math.round(durationInSeconds * fps);
  }, 0);

  // Calculate transition frame reductions
  // Fade transitions overlap, light leaks don't affect duration
  let transitionReduction = 0;
  for (let i = 0; i < slides.length - 1; i++) {
    const hasLightLeak = i % 2 === 0;
    if (!hasLightLeak) {
      transitionReduction += TRANSITION_DURATION;
    }
  }

  return totalSlideFrames - transitionReduction;
};
