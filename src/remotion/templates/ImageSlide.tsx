import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import {
    AbsoluteFill,
    Html5Audio,
    Img, interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import { GRADIENT_PRESETS, parseBackground } from "../utils/backgrounds";
import { getAudioSrc } from "../utils/audio-src";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "600"],
});

export type KenBurnsEffect = "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "none";

export interface ImageSlideProps {
  imageUrl: string;
  caption?: string;
  kenBurns?: KenBurnsEffect;
  backgroundColor?: string;
  creditText?: string;
  narrationUrl?: string;
}

export const ImageSlide: React.FC<ImageSlideProps> = ({
  imageUrl,
  caption,
  kenBurns = "zoomIn",
  backgroundColor = GRADIENT_PRESETS.darkSpace,
  creditText,
  narrationUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Progress from 0 to 1 over the duration
  const progress = frame / durationInFrames;

  // Ken Burns transformations
  const getKenBurnsTransform = (): React.CSSProperties => {
    switch (kenBurns) {
      case "zoomIn": {
        const scale = interpolate(progress, [0, 1], [1, 1.15]);
        return { transform: `scale(${scale})` };
      }
      case "zoomOut": {
        const scale = interpolate(progress, [0, 1], [1.15, 1]);
        return { transform: `scale(${scale})` };
      }
      case "panLeft": {
        const translateX = interpolate(progress, [0, 1], [5, -5]);
        return { transform: `scale(1.1) translateX(${translateX}%)` };
      }
      case "panRight": {
        const translateX = interpolate(progress, [0, 1], [-5, 5]);
        return { transform: `scale(1.1) translateX(${translateX}%)` };
      }
      case "none":
      default:
        return {};
    }
  };

  // Caption animation
  const captionOpacity = spring({
    fps,
    frame: frame - fps * 0.5, // Delay caption by 0.5s
    config: { damping: 20, stiffness: 100 },
  });

  const captionY = interpolate(
    captionOpacity,
    [0, 1],
    [30, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const bgStyle = parseBackground(backgroundColor);

  return (
    <AbsoluteFill style={{ ...bgStyle, overflow: "hidden" }}>
      {/* Image container with Ken Burns */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            ...getKenBurnsTransform(),
          }}
        />
      </div>

      {/* Gradient overlay for caption readability */}
      {caption && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
          }}
        />
      )}

      {/* Caption */}
      {caption && (
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            padding: "0 100px",
          }}
        >
          <p
            style={{
              fontFamily,
              fontSize: 42,
              fontWeight: 600,
              color: "#ffffff",
              textAlign: "center",
              opacity: captionOpacity,
              transform: `translateY(${captionY}px)`,
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              lineHeight: 1.4,
              maxWidth: "80%",
            }}
          >
            {caption}
          </p>
        </div>
      )}

      {/* Photo credit */}
      {creditText && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 30,
            fontFamily,
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Photo: {creditText}
        </div>
      )}
      {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
    </AbsoluteFill>
  );
};
