import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Html5Audio,
  Img,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import { getAudioSrc } from "../utils/audio-src";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "600", "700", "800", "900"],
});

export interface SingleQuizSlideProps {
  question: string;
  correctIndex: number;
  options: string[];
  imageQuery: string;
  imageUrl?: string;
  backgroundColor?: string;
  durationInSeconds?: number;
  revealTimeSeconds?: number;
  questionNumber: number;
  quizTitle: string;
  narrationUrl?: string;
}

// ── Bubble Component ─────────────────────────────────────────────
interface BubbleProps {
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  opacity: number;
}

const Bubble: React.FC<BubbleProps> = ({ x, y, size, speed, delay, opacity }) => {
  const frame = useCurrentFrame();

  // Floating animation using sine wave
  const floatY = Math.sin((frame + delay) * speed * 0.02) * 30;
  const floatX = Math.cos((frame + delay) * speed * 0.015) * 20;

  // Gentle scale pulse
  const scalePulse = 1 + Math.sin((frame + delay) * 0.03) * 0.1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + floatY,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,${opacity * 0.6}), rgba(255,255,255,${opacity * 0.1}))`,
        border: `1px solid rgba(255,255,255,${opacity * 0.3})`,
        transform: `translate(${floatX}px, 0) scale(${scalePulse})`,
      }}
    />
  );
};

// ── Deterministic seeded random ──────────────────────────────────
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

export const SingleQuizSlide: React.FC<SingleQuizSlideProps> = ({
  question,
  correctIndex,
  options,
  imageQuery,
  imageUrl,
  backgroundColor = "#c2185b",
  durationInSeconds = 10,
  revealTimeSeconds,
  questionNumber,
  quizTitle,
  narrationUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Timing: use exact audio timestamp if available, else fallback to 89%
  const revealFrame = revealTimeSeconds
    ? revealTimeSeconds * fps
    : durationInSeconds * 0.89 * fps;
  const isRevealed = frame >= revealFrame;

  // ── Bubbles (seeded for determinism) ──────────────────────────
  const bubbles: BubbleProps[] = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: seededRandom(i * 7 + 1) * width,
      y: seededRandom(i * 7 + 2) * height,
      size: 20 + seededRandom(i * 7 + 3) * 80,
      speed: 0.5 + seededRandom(i * 7 + 4) * 2,
      delay: seededRandom(i * 7 + 5) * 200,
      opacity: 0.15 + seededRandom(i * 7 + 6) * 0.25,
    }));
  }, [width, height]);

  // ── Entrance animations ───────────────────────────────────────
  const headerSpring = spring({ fps, frame: frame - 5, config: { damping: 20, stiffness: 100 } });
  const imageSpring = spring({ fps, frame: frame - 15, config: { damping: 18, stiffness: 90 } });
  const questionSpring = spring({ fps, frame: frame - 20, config: { damping: 18, stiffness: 90 } });
  const optionsSpring = spring({ fps, frame: frame - 30, config: { damping: 15, stiffness: 80 } });

  // ── Answer reveal animation ───────────────────────────────────
  const revealSpring = spring({ fps, frame: frame - revealFrame, config: { damping: 12, stiffness: 150 } });

  // Mystery image → real image crossfade
  const mysteryOpacity = isRevealed ? interpolate(revealSpring, [0, 1], [1, 0]) : 1;
  const realImageOpacity = isRevealed ? interpolate(revealSpring, [0, 1], [0, 1]) : 0;

  // Answer bar slide-up
  const answerY = interpolate(revealSpring, [0, 1], [80, 0]);
  const answerOpacity = interpolate(revealSpring, [0, 1], [0, 1]);

  // Badge number
  const badgeSpring = spring({ fps, frame: frame - 2, config: { damping: 15, stiffness: 200 } });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1]);

  // Option labels
  const optionLabels = ["A", "B", "C", "D"];

  const answer = options[correctIndex] || "";

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Animated Background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 50%, ${backgroundColor}bb 100%)`,
        }}
      />

      {/* Floating Bubbles */}
      {bubbles.map((bubble, i) => (
        <Bubble key={i} {...bubble} />
      ))}

      {/* ── Header Bar ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: headerSpring,
          transform: `translateY(${interpolate(headerSpring, [0, 1], [-30, 0])}px)`,
        }}
      >
        <h1
          style={{
            fontFamily,
            fontSize: 48,
            fontWeight: 900,
            color: "#ffffff",
            textShadow: "3px 3px 8px rgba(0,0,0,0.3)",
            letterSpacing: -1,
          }}
        >
          {quizTitle}
        </h1>
      </div>

      {/* ── Question Number Badge (top-left) ───────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 40,
          width: 64,
          height: 64,
          borderRadius: "50%",
          backgroundColor: "#00bcd4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          transform: `scale(${badgeScale})`,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 32,
            fontWeight: 900,
            color: "#ffffff",
          }}
        >
          {questionNumber}
        </span>
      </div>

      {/* ── Main Content Area ──────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 40,
          right: 40,
          bottom: 130,
          display: "flex",
          gap: 30,
        }}
      >
        {/* ── Left Panel: Image ────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: "#ffffff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            opacity: imageSpring,
            transform: `translateX(${interpolate(imageSpring, [0, 1], [-60, 0])}px)`,
            position: "relative",
          }}
        >
          {/* Mystery Placeholder */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 50%, #e0e0e0 100%)",
              opacity: mysteryOpacity,
              zIndex: 2,
            }}
          >
            <span
              style={{
                fontSize: 160,
                fontWeight: 900,
                color: "#bdbdbd",
                fontFamily,
                textShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
            >
              ?
            </span>
            <span
              style={{
                fontSize: 18,
                color: "#9e9e9e",
                fontFamily,
                fontWeight: 600,
                marginTop: -10,
              }}
            >
              Answer reveals soon...
            </span>
          </div>

          {/* Real Image (fades in on reveal) */}
          {imageUrl && (
            <Img
              src={imageUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: realImageOpacity,
                position: "absolute",
                inset: 0,
                zIndex: 1,
              }}
            />
          )}
        </div>

        {/* ── Right Panel: Question + Options ──────────────────── */}
        <div
          style={{
            flex: 1,
            borderRadius: 20,
            backgroundColor: "#e0f7fa",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            padding: 50,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: questionSpring,
            transform: `translateX(${interpolate(questionSpring, [0, 1], [60, 0])}px)`,
          }}
        >
          {/* Question Text */}
          <h2
            style={{
              fontFamily,
              fontSize: 42,
              fontWeight: 800,
              color: "#1a1a2e",
              lineHeight: 1.3,
              marginBottom: 40,
              textAlign: "center",
            }}
          >
            {question}
          </h2>

          {/* Options Grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              opacity: optionsSpring,
              transform: `translateY(${interpolate(optionsSpring, [0, 1], [30, 0])}px)`,
            }}
          >
            {options.map((option, i) => {
              // Highlight correct option on reveal
              const isCorrect = i === correctIndex;
              const optionBgColor = isRevealed && isCorrect
                ? interpolateColors(revealSpring, [0, 1], ["#ffffff", "rgba(76, 175, 80, 0.9)"])
                : isRevealed
                ? interpolateColors(revealSpring, [0, 1], ["#ffffff", "rgba(255,255,255,0.5)"])
                : "#ffffff";
              const optionTextColor = isRevealed && isCorrect
                ? interpolateColors(revealSpring, [0, 1], ["#333333", "#ffffff"])
                : isRevealed
                ? interpolateColors(revealSpring, [0, 1], ["#333333", "#999999"])
                : "#333333";

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    backgroundColor: optionBgColor,
                    borderRadius: 12,
                    padding: "12px 20px",
                    border: `2px solid ${isRevealed && isCorrect ? "#4caf50" : "rgba(0,0,0,0.08)"}`,
                    transform: isRevealed && isCorrect ? `scale(${interpolate(revealSpring, [0, 1], [1, 1.03])})` : "scale(1)",
                  }}
                >
                  <span
                    style={{
                      fontFamily,
                      fontWeight: 800,
                      fontSize: 18,
                      color: isRevealed && isCorrect ? "#ffffff" : "#888888",
                      width: 28,
                    }}
                  >
                    {optionLabels[i]}.
                  </span>
                  <span
                    style={{
                      fontFamily,
                      fontWeight: 700,
                      fontSize: 22,
                      color: optionTextColor,
                    }}
                  >
                    {option}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Answer Bar (bottom, revealed after 5s) ─────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(10px)",
          opacity: answerOpacity,
          transform: `translateY(${answerY}px)`,
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 44,
            fontWeight: 800,
            color: "#ffffff",
          }}
        >
          Answer:{" "}
          <span style={{ color: "#ffeb3b", fontWeight: 900 }}>{answer}</span>
        </span>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 6,
          backgroundColor: "#ffeb3b",
          width: `${(frame / (durationInSeconds * fps)) * 100}%`,
          zIndex: 20,
        }}
      />
      {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
    </AbsoluteFill>
  );
};
