import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GRADIENT_PRESETS, parseBackground } from "../utils/backgrounds";
import { getAudioSrc } from "../utils/audio-src";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["800"],
});

export interface IntroSlideProps {
  title: string;
  subtitle?: string;
  author?: string;
  backgroundColor?: string;
  narrationUrl?: string;
}

export const IntroSlide: React.FC<IntroSlideProps> = ({
  title,
  subtitle,
  author,
  backgroundColor = GRADIENT_PRESETS.darkSpace,
  narrationUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title Animation (Scale + Blur In)
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  
  const titleScale = spring({
    fps,
    frame,
    config: { damping: 200, stiffness: 100, mass: 2 },
  });
  
  // Subtitle Animation (Slide Up)
  const subtitleOpacity = spring({
    fps,
    frame: frame - 15,
    config: { damping: 20, stiffness: 100 },
  });
  
  const subtitleY = interpolate(
    subtitleOpacity,
    [0, 1],
    [50, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  
  // Author Animation (Fade In)
  const authorOpacity = interpolate(frame, [30, 60], [0, 0.8], {
    extrapolateRight: "clamp",
  });

  const bgStyle = parseBackground(backgroundColor);

  return (
    <AbsoluteFill
      style={{
        ...bgStyle,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: 100,
      }}
    >
      {/* Decorative Line */}
      <div
        style={{
          width: 0, 
          height: 8,
          backgroundColor: "#6366f1",
          marginBottom: 40,
          borderRadius: 4,
          // Expand animation handled via style override
          minWidth: interpolate(frame, [0, 30], [0, 200], { extrapolateRight: "clamp" }),
        }}
      />

      <h1
        style={{
          fontFamily,
          fontSize: 120,
          fontWeight: 800,
          color: "#ffffff",
          margin: 0,
          marginBottom: 20,
          textAlign: "center",
          lineHeight: 1.1,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textShadow: "0 10px 30px rgba(0,0,0,0.5)",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <h2
          style={{
            fontFamily,
            fontSize: 48,
            fontWeight: 400,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
            textAlign: "center",
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          {subtitle}
        </h2>
      )}

      {author && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            fontFamily,
            fontSize: 24,
            color: "#ffffff",
            opacity: authorOpacity,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          By {author}
        </div>
      )}
      {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
    </AbsoluteFill>
  );
};
