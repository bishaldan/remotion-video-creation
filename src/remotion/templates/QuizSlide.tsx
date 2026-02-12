import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
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
  weights: ["400", "600", "800"],
});

export interface QuizSlideProps {
  question: string;
  options: string[];
  correctIndex: number;
  backgroundUrl?: string;
  backgroundQuery?: string;
  durationInSeconds?: number;
  revealTimeSeconds?: number;
  narrationUrl?: string;
}

export const DualQuizSlide: React.FC<QuizSlideProps> = ({
  question,
  options,
  correctIndex,
  backgroundUrl,
  backgroundQuery,
  durationInSeconds = 7,
  revealTimeSeconds,
  narrationUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Answer reveal: use exact audio timestamp if available, else fallback to 89%
  const revealFrame = revealTimeSeconds 
    ? revealTimeSeconds * fps 
    : (durationInSeconds * 0.89) * fps;
  
  // Background Image with Ken Burns
  const progress = frame / (durationInSeconds * fps);
  const scale = interpolate(progress, [0, 1], [1, 1.15]);
  
  // Use resolved URL or fallback to source.unsplash
  // Note: backgroundUrl might be undefined initially if not resolved yet
  const bgImage = backgroundUrl || 
    (backgroundQuery ? `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(backgroundQuery)}` : null);

  // Question Animation (Slide down + fade in)
  const questionSpring = spring({
    fps,
    frame: frame - 10,
    config: { damping: 20, stiffness: 100 },
  });
  
  const questionY = interpolate(questionSpring, [0, 1], [-50, 0]);

  // Render options
  const renderOption = (option: string, index: number) => {
    // Stagger animations: 0.2s between each option
    const delay = 30 + (index * 10); 
    
    // Entrance animation
    const optionSpring = spring({
      fps,
      frame: frame - delay,
      config: { damping: 15, stiffness: 120 },
    });
    
    const optionX = interpolate(optionSpring, [0, 1], [-50, 0]);
    
    // Reveal animation (only for correct/incorrect logic)
    // Reveal logic: If frame >= revealFrame
    const isRevealed = frame >= revealFrame;
    const isCorrect = index === correctIndex;
    
    // Base colors
    const baseBgColor = "rgba(255, 255, 255, 0.15)";
    const baseBorderColor = "rgba(255, 255, 255, 0.3)";
    const baseTextColor = "#ffffff";

    // Target colors
    const targetBgColor = isCorrect ? "rgba(34, 197, 94, 0.9)" : "rgba(255, 255, 255, 0.05)";
    const targetBorderColor = isCorrect ? "#22c55e" : "rgba(255, 255, 255, 0.1)";
    const targetTextColor = isCorrect ? "#ffffff" : "rgba(255, 255, 255, 0.6)";

    // Pop animation when revealing answer
    const popSpring = spring({
        fps,
        frame: frame - revealFrame,
        config: { damping: 10, stiffness: 200 }
    });

    const revealScale = isRevealed && isCorrect 
        ? interpolate(popSpring, [0, 1], [1, 1.05]) 
        : 1;

    // Interpolate colors based on popSpring
    // We use popSpring as the progress driver (0 -> 1) once revealed
    const bgColor = interpolateColors(popSpring, [0, 1], [baseBgColor, targetBgColor]);
    const borderColor = interpolateColors(popSpring, [0, 1], [baseBorderColor, targetBorderColor]);
    const textColor = interpolateColors(popSpring, [0, 1], [baseTextColor, targetTextColor]);

    return (
      <div
        key={index}
        style={{
            position: 'relative',
            width: '100%',
            backgroundColor: bgColor,
            border: `2px solid ${borderColor}`,
            borderRadius: 16,
            padding: '16px 24px',
            marginBottom: 12,
            opacity: optionSpring,
            transform: `translateX(${optionX}px) scale(${revealScale})`,
            display: 'flex',
            alignItems: 'center',
            cursor: 'default',
            boxShadow: isRevealed && isCorrect ? '0 0 30px rgba(34, 197, 94, 0.4)' : 'none',
        }}
      >
        <span style={{ 
            fontFamily, 
            fontWeight: 800, 
            color: isRevealed && isCorrect ? '#ffffff' : 'rgba(255,255,255,0.7)',
            marginRight: 16,
            fontSize: 20,
            width: 24,
        }}>
            {String.fromCharCode(65 + index)}
        </span>
        <span style={{ 
            fontFamily, 
            fontWeight: 600, 
            color: textColor, 
            fontSize: 22,
            flex: 1
        }}>
            {option}
        </span>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: '#000' }}>
      {/* Background Image */}
      {bgImage && (
        <AbsoluteFill>
          <Img
            src={bgImage}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${scale})`,
            }}
          />
          {/* Dark Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.85))'
          }} />
        </AbsoluteFill>
      )}

      {/* Content Container */}
      <AbsoluteFill style={{
          padding: 60, // Safe area
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
      }}>
        
        {/* Question */}
        <div style={{
            width: '100%',
            maxWidth: 1000,
            textAlign: 'center',
            marginBottom: 60,
            opacity: questionSpring,
            transform: `translateY(${questionY}px)`
        }}>
            <h2 style={{
                fontFamily,
                fontSize: 52, // Large readable text
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.2,
                textShadow: '0 4px 24px rgba(0,0,0,0.8)'
            }}>
                {question}
            </h2>
        </div>

        {/* Options Grid */}
        <div style={{
            width: '100%',
            maxWidth: 800, // Constrain width for better readability
            display: 'flex',
            flexDirection: 'column',
        }}>
            {options.map((opt, i) => renderOption(opt, i))}
        </div>
        
        {/* Timer / Progress bar at bottom */}
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 8,
            backgroundColor: '#6366f1',
            width: `${(frame / (durationInSeconds * fps)) * 100}%`
        }} />

        {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
