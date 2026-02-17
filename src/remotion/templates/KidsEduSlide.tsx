import { fontFamily, loadFont } from "@remotion/google-fonts/Outfit";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React, { useMemo } from "react";
import {
    AbsoluteFill,
    Html5Audio,
    Img,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import { getAudioSrc } from "../utils/audio-src";

loadFont("normal", {
    weights: ["400", "700"],
});

interface KidsEduSlideProps {
    lines: string[];
    backgroundImageUrls?: string[];
    durationInSeconds: number;
    narrationUrl?: string;
}

const BG_TRANSITION_DURATION = 15; // 0.5s at 30fps

export const KidsEduSlide: React.FC<KidsEduSlideProps> = ({
    lines,
    backgroundImageUrls = [],
    durationInSeconds,
    narrationUrl,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // 1. Calculate timing for text synchronization
    // We estimate word timing assuming constant speaking rate
    const allWords = useMemo(() => {
        return lines.map((line) => line.split(" "));
    }, [lines]);

    const flatWords = useMemo(() => {
        return allWords.flat();
    }, [allWords]);

    const totalWords = flatWords.length;
    const totalFrames = durationInSeconds * fps;
    const framesPerWord = totalFrames / (totalWords || 1);

    const currentWordGlobalIndex = Math.floor(frame / framesPerWord);

    // Find which line is active based on current word index
    let wordCountSoFar = 0;
    let activeLineIndex = 0;
    let activeLineWordStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineWordCount = allWords[i].length;
        if (currentWordGlobalIndex >= wordCountSoFar && currentWordGlobalIndex < wordCountSoFar + lineWordCount) {
            activeLineIndex = i;
            activeLineWordStartIndex = wordCountSoFar;
            break;
        }
        wordCountSoFar += lineWordCount;
        // Keep last line active if we overshoot (e.g. end of audio buffer)
        if (i === lines.length - 1) {
            activeLineIndex = i;
            activeLineWordStartIndex = wordCountSoFar - lineWordCount;
        }
    }

    const currentLineWords = allWords[activeLineIndex] || [];
    const currentWordLocalIndex = currentWordGlobalIndex - activeLineWordStartIndex;

    // 2. Background Image Cycling
    // Cycle images every 5 seconds (150 frames at 30fps)
    const IMAGE_DURATION_IN_SECONDS = 5;
    const imageDurationInFrames = IMAGE_DURATION_IN_SECONDS * fps;

    return (
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
            {/* Background Layer with Transitions */}
            {backgroundImageUrls.length > 0 ? (
                <TransitionSeries>
                    {Array.from({ length: Math.ceil((totalFrames - imageDurationInFrames) / (imageDurationInFrames - BG_TRANSITION_DURATION)) + 2 }).map((_, i) => {
                        // Cycle through images
                        const imageIndex = i % backgroundImageUrls.length;
                        const url = backgroundImageUrls[imageIndex];

                        // Each slide gets the full duration; TransitionSeries handles the timeline.
                        // We just need enough slides to cover the total duration.
                        return (
                            <React.Fragment key={i}>
                                <TransitionSeries.Sequence durationInFrames={Math.round(imageDurationInFrames)}>
                                    <AbsoluteFill>
                                        <Img
                                            src={url}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                // "Droplet" animation: Slow breathing scale
                                                transform: `scale(${i % 2 === 0 ? 1.0 : 1.15})`,
                                                animation: `breathing${i % 2} ${IMAGE_DURATION_IN_SECONDS + 1}s ease-in-out infinite alternate`,
                                            }}
                                        />
                                        <style>
                                            {`
                                                @keyframes breathing0 {
                                                    0% { transform: scale(1.0); }
                                                    100% { transform: scale(1.15); }
                                                }
                                                @keyframes breathing1 {
                                                    0% { transform: scale(1.15); }
                                                    100% { transform: scale(1.0); }
                                                }
                                            `}
                                        </style>
                                        <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.4)" }} />
                                    </AbsoluteFill>
                                </TransitionSeries.Sequence>

                                {/* Transition to next slide */}
                                {i < Math.ceil((totalFrames - imageDurationInFrames) / (imageDurationInFrames - BG_TRANSITION_DURATION)) + 1 && (
                                    <TransitionSeries.Transition
                                        presentation={fade()}
                                        timing={linearTiming({ durationInFrames: BG_TRANSITION_DURATION })}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </TransitionSeries>
            ) : (
                <AbsoluteFill style={{ backgroundColor: "#ffcc00" }} />
            )}

            {/* Text Layer */}
            <AbsoluteFill
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 60,
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        fontFamily,
                        fontSize: 90,
                        fontWeight: 700,
                        textAlign: "center",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: "20px",
                        width: "100%",
                        textShadow: "0 4px 8px rgba(0,0,0,0.6)",
                    }}
                >
                    {currentLineWords.map((word, i) => {
                        const isHighlighted = i === currentWordLocalIndex;
                        const isFuture = i > currentWordLocalIndex;

                        return (
                            <span
                                key={i}
                                style={{
                                    backgroundColor: isHighlighted ? "#ffffff" : "transparent",
                                    color: isHighlighted ? "#000000" : "#ffffff",
                                    borderRadius: "15px",
                                    padding: "4px 12px",
                                    // Highlighted word gets a pop effect
                                    transform: isHighlighted ? "scale(1.15) rotate(-2deg)" : "scale(1) rotate(0deg)",
                                    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                    opacity: isFuture ? 0.6 : 1,
                                    margin: "0 4px",
                                    display: "inline-block", // Needed for transform/bg to work nicely
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>
            </AbsoluteFill>

            {/* Audio */}
            {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
        </AbsoluteFill>
    );
};
