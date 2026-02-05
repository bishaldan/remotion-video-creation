import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { z } from "zod";
import {
    TimelineSchema,
    VIDEO_FPS,
    type Slide,
} from "../../../types/constants";
import { BulletSlide } from "../templates/BulletSlide";
import { DiagramSlide } from "../templates/DiagramSlide";
import { TextSlide } from "../templates/TextSlide";
import { ThreeDSlide } from "../templates/ThreeDSlide";

export const EduMain: React.FC<z.infer<typeof TimelineSchema>> = ({
  slides,
}) => {
  // Calculate frame offsets for each slide
  let currentFrame = 0;

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
          />
        );
      case "diagram":
        return (
          <DiagramSlide
            title={slide.title}
            nodes={slide.nodes}
            arrows={slide.arrows}
            backgroundColor={slide.backgroundColor}
          />
        );
      case "threeD":
        return (
          <ThreeDSlide
            title={slide.title}
            shape={slide.shape}
            color={slide.color}
            backgroundColor={slide.backgroundColor}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      {slides.map((slide, index) => {
        const durationInSeconds = slide.durationInSeconds || 5;
        const durationInFrames = Math.round(durationInSeconds * VIDEO_FPS);
        const fromFrame = currentFrame;
        currentFrame += durationInFrames;

        return (
          <Sequence
            key={index}
            from={fromFrame}
            durationInFrames={durationInFrames}
          >
            {renderSlide(slide)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Helper function to calculate total duration of a timeline
export const calculateTimelineDuration = (
  slides: Slide[],
  fps: number = VIDEO_FPS
): number => {
  return slides.reduce((total, slide) => {
    const durationInSeconds = slide.durationInSeconds || 5;
    return total + Math.round(durationInSeconds * fps);
  }, 0);
};
