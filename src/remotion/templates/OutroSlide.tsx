import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import { Lottie } from "@remotion/lottie";
import React, { useEffect, useState } from "react";
import {
    AbsoluteFill,
    continueRender,
    delayRender,
    Html5Audio,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig
} from "remotion";
import { getAudioSrc } from "../utils/audio-src";
import { GRADIENT_PRESETS, parseBackground } from "../utils/backgrounds";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["800", "500"],
});

// Confetti animation - verified working public URL
const CONFETTI_URL = "https://assets10.lottiefiles.com/packages/lf20_u4yrau.json";

export interface OutroSlideProps {
  title?: string;
  callToAction?: string;
  backgroundColor?: string;
  narrationUrl?: string;
}

export const OutroSlide: React.FC<OutroSlideProps> = ({
  title = "Thanks for Watching!",
  callToAction = "Generated with Remotion",
  backgroundColor = GRADIENT_PRESETS.darkSpace,
  narrationUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender("Loading Confetti"));
  const [confettiData, setConfettiData] = useState(null);

  useEffect(() => {
    fetch(CONFETTI_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
        return res.text();
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);
          setConfettiData(data);
        } catch (e) {
          throw new Error('Invalid JSON');
        }
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Confetti fetch error", err);
        continueRender(handle);
      });
  }, [handle]);

  // Title Animation
  const titleOpacity = spring({
    fps,
    frame: frame - 10,
    config: { damping: 20, stiffness: 100 },
  });

  const titleScale = interpolate(
    titleOpacity,
    [0, 1],
    [0.8, 1],
    { extrapolateRight: "clamp" }
  );

  // CTA Animation
  const ctaOpacity = spring({
    fps,
    frame: frame - 35,
    config: { damping: 20, stiffness: 100 },
  });

  const bgStyle = parseBackground(backgroundColor);

  return (
    <AbsoluteFill
      style={{
        ...bgStyle,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Confetti Background */}
      {confettiData && (
        <AbsoluteFill style={{ zIndex: 0, opacity: 0.6 }}>
          <Lottie animationData={confettiData} loop={false} />
        </AbsoluteFill>
      )}

      <div style={{ zIndex: 1, textAlign: "center", padding: "0 40px" }}>
        <h1
          style={{
            fontFamily,
            fontSize: 100,
            fontWeight: 800,
            color: "#ffffff",
            margin: "0 0 40px 0",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            textShadow: "0 10px 30px rgba(0,0,0,0.5)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>

        <div
          style={{
            fontFamily,
            fontSize: 42,
            fontWeight: 500,
            color: "#6366f1",
            backgroundColor: "#ffffff",
            padding: "20px 60px",
            borderRadius: 50,
            boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)",
            opacity: ctaOpacity,
            transform: `translateY(${interpolate(ctaOpacity, [0, 1], [50, 0])}px)`,
          }}
        >
          {callToAction}
        </div>
      </div>
      {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
    </AbsoluteFill>
  );
};
