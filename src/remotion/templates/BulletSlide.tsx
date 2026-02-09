import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GRADIENT_PRESETS, parseBackground } from "../utils/backgrounds";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "700"],
});

export interface BulletSlideProps {
  title?: string;
  bullets: string[];
  bulletIcon?: string;
  titleColor?: string;
  bulletColor?: string;
  backgroundColor?: string;
}

export const BulletSlide: React.FC<BulletSlideProps> = ({
  title,
  bullets,
  bulletIcon = "•",
  titleColor = "#ffffff",
  bulletColor = "#e2e8f0",
  backgroundColor = GRADIENT_PRESETS.purpleBlue,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.3], [-20, 0], {
    extrapolateRight: "clamp",
  });

  // Calculate timing for bullets
  const titleDuration = fps * 0.5;
  const bulletsStartFrame = titleDuration;
  const bulletAnimDuration = (durationInFrames - bulletsStartFrame) / bullets.length;

  // Helper to parse **bold** markdown
  const renderTextWithMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={i} style={{ fontWeight: 700 }}>
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const bgStyle = parseBackground(backgroundColor);

  return (
    <AbsoluteFill
      style={{
        ...bgStyle,
        padding: 80,
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      {title && (
        <h1
          style={{
            fontFamily,
            fontSize: 56,
            fontWeight: 700,
            color: titleColor,
            marginBottom: 50,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {title}
        </h1>
      )}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}
      >
        {bullets.map((bullet, index) => {
          const bulletStart = bulletsStartFrame + index * bulletAnimDuration;
          const bulletOpacity = interpolate(
            frame,
            [bulletStart, bulletStart + fps * 0.25],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const bulletX = interpolate(
            frame,
            [bulletStart, bulletStart + fps * 0.25],
            [-40, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <li
              key={index}
              style={{
                fontFamily,
                fontSize: 36,
                color: bulletColor,
                marginBottom: 24,
                opacity: bulletOpacity,
                transform: `translateX(${bulletX}px)`,
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <span style={{ 
                color: "#a78bfa", 
                fontWeight: 700,
                fontFamily: "'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Twemoji Mozilla', sans-serif",
                fontSize: 32,
              }}>
                {bulletIcon}
              </span>
              <span style={{ flex: 1 }}>{renderTextWithMarkdown(bullet)}</span>
            </li>
          );
        })}
      </ul>
    </AbsoluteFill>
  );
};
