import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import React, { useEffect, useState } from "react";
import {
    AbsoluteFill, continueRender,
    delayRender, Html5Audio, interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig
} from "remotion";
import { GRADIENT_PRESETS, parseBackground } from "../utils/backgrounds";
import { getAudioSrc } from "../utils/audio-src";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "600", "700"],
});

// Verified working Lottie animation URLs - ALL are person/character animations
// These are public assets from LottieFiles CDN
export const LOTTIE_ANIMATIONS = {
  // Person explaining/talking
  explaining: "https://assets9.lottiefiles.com/packages/lf20_v1yudlrx.json",
  // Person with question mark thinking
  thinking: "https://assets9.lottiefiles.com/packages/lf20_syqnfe7c.json",
  // Person pointing at something
  pointing: "https://assets4.lottiefiles.com/packages/lf20_ydo1amjm.json",
  // Person celebrating with arms up
  celebrating: "https://assets9.lottiefiles.com/packages/lf20_touohxv0.json",
  // Person writing on whiteboard
  writing: "https://assets9.lottiefiles.com/packages/lf20_w51pcehl.json",
  // Person presenting with chart/board
  presenting: "https://assets9.lottiefiles.com/packages/lf20_4kx2q32n.json",
} as const;

export type LottieAnimationType = keyof typeof LOTTIE_ANIMATIONS;

export interface LottieSlideProps {
  animationType: LottieAnimationType;
  animationUrl?: string; // Override with custom URL
  text: string;
  title?: string;
  position?: "left" | "right";
  backgroundColor?: string;
  narrationUrl?: string;
}

export const LottieSlide: React.FC<LottieSlideProps> = ({
  animationType,
  animationUrl,
  text,
  title,
  position = "left",
  backgroundColor = GRADIENT_PRESETS.purpleBlue,
  narrationUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender("Loading Lottie animation"));
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);
  const [loadError, setLoadError] = useState(false);

  const lottieUrl = animationUrl || LOTTIE_ANIMATIONS[animationType] || LOTTIE_ANIMATIONS.explaining;

  useEffect(() => {
    fetch(lottieUrl)
      .then((response) => {
        if (!response.ok) {
          console.warn(`Lottie fetch failed (${response.status}) for: ${lottieUrl}`);
          throw new Error(`HTTP ${response.status}`);
        }
        // Check content type to avoid parsing HTML error pages
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`Lottie response not JSON (${contentType}) for: ${lottieUrl}`);
          throw new Error('Response is not JSON');
        }
        return response.text();
      })
      .then((text) => {
        try {
          const json = JSON.parse(text);
          setAnimationData(json);
        } catch (e) {
          console.warn(`Lottie JSON parse failed for: ${lottieUrl}`);
          throw new Error('Invalid JSON');
        }
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Lottie load error:", err);
        setLoadError(true);
        continueRender(handle); // Continue without animation
      });
  }, [lottieUrl, handle]);

  // Text animations
  const titleOpacity = spring({
    fps,
    frame,
    config: { damping: 20, stiffness: 80 },
  });

  const textOpacity = spring({
    fps,
    frame: frame - fps * 0.3, // Delay text by 0.3s
    config: { damping: 20, stiffness: 80 },
  });

  const textY = interpolate(
    textOpacity,
    [0, 1],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Lottie animation entrance
  const lottieScale = spring({
    fps,
    frame: frame - fps * 0.2,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });

  const bgStyle = parseBackground(backgroundColor);
  const isLeftPosition = position === "left";

  return (
    <AbsoluteFill style={{ ...bgStyle }}>
      <div
        style={{
          display: "flex",
          flexDirection: isLeftPosition ? "row" : "row-reverse",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "60px 100px",
          gap: 60,
        }}
      >
        {/* Lottie Animation */}
        <div
          style={{
            flex: "0 0 400px",
            height: 400,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${lottieScale})`,
          }}
        >
          {animationData && !loadError ? (
            <Lottie
              animationData={animationData}
              style={{ width: 400, height: 400 }}
            />
          ) : (
            // Fallback if Lottie fails to load
            <div
              style={{
                width: 300,
                height: 300,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.1)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 100,
              }}
            >
              {animationType === "explaining" && "💡"}
              {animationType === "thinking" && "🤔"}
              {animationType === "pointing" && "👉"}
              {animationType === "celebrating" && "🎉"}
              {animationType === "writing" && "✍️"}
              {animationType === "presenting" && "🎤"}
            </div>
          )}
        </div>

        {/* Text Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {title && (
            <h2
              style={{
                fontFamily,
                fontSize: 48,
                fontWeight: 700,
                color: "#ffffff",
                margin: 0,
                opacity: titleOpacity,
                textShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {title}
            </h2>
          )}
          <p
            style={{
              fontFamily,
              fontSize: 32,
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.5,
              margin: 0,
              opacity: textOpacity,
              transform: `translateY(${textY}px)`,
              textShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            {text}
          </p>
        </div>
      </div>
      {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
    </AbsoluteFill>
  );
};
