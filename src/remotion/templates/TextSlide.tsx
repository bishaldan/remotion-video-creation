import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import {
    AbsoluteFill,
    Html5Audio,
    interpolate,
    staticFile,
    useCurrentFrame,
    useVideoConfig
} from "remotion";
import { GRADIENT_PRESETS, parseBackground } from "../utils/backgrounds";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "700"],
});

export type TextAnimation = "typewriter" | "fadeIn" | "wordByWord";

export interface TextSlideProps {
  text: string;
  animation?: TextAnimation;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  narrationUrl?: string;
}

export const TextSlide: React.FC<TextSlideProps> = ({
  text,
  animation = "fadeIn",
  fontSize = 64,
  color = "#ffffff",
  backgroundColor = GRADIENT_PRESETS.darkSpace,
  narrationUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const renderTypewriter = () => {
    const charPerFrame = text.length / (durationInFrames * 0.7);
    const charsToShow = Math.floor(frame * charPerFrame);
    const visibleText = text.slice(0, charsToShow);
    const cursor = frame % (fps / 2) < fps / 4 ? "|" : "";

    return (
      <span style={{ fontFamily }}>
        {visibleText}
        <span style={{ opacity: charsToShow < text.length ? 1 : 0 }}>{cursor}</span>
      </span>
    );
  };

  const renderFadeIn = () => {
    const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
      extrapolateRight: "clamp",
    });
    const scale = interpolate(frame, [0, fps * 0.5], [0.9, 1], {
      extrapolateRight: "clamp",
    });

    return (
      <span
        style={{
          fontFamily,
          opacity,
          transform: `scale(${scale})`,
          display: "inline-block",
        }}
      >
        {text}
      </span>
    );
  };

  const renderWordByWord = () => {
    const words = text.split(" ");
    const framesPerWord = (durationInFrames * 0.6) / words.length;

    return (
      <span style={{ fontFamily }}>
        {words.map((word, index) => {
          const wordStart = index * framesPerWord;
          const opacity = interpolate(
            frame,
            [wordStart, wordStart + fps * 0.2],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const translateY = interpolate(
            frame,
            [wordStart, wordStart + fps * 0.2],
            [20, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <span
              key={index}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                display: "inline-block",
                marginRight: "0.3em",
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  const bgStyle = parseBackground(backgroundColor);

  return (
    <AbsoluteFill
      style={{
        ...bgStyle,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: 700,
          color,
          textAlign: "center",
          lineHeight: 1.3,
          maxWidth: "80%",
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {animation === "typewriter" && renderTypewriter()}
        {animation === "fadeIn" && renderFadeIn()}
        {animation === "wordByWord" && renderWordByWord()}
      </div>
      {narrationUrl && <Html5Audio src={staticFile(narrationUrl)} />}
    </AbsoluteFill>
  );
};
