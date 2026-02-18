import { fontFamily, loadFont } from "@remotion/google-fonts/Outfit";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import React, { useMemo } from "react";
import {
    AbsoluteFill,
    Html5Audio,
    Img,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import { getAudioSrc } from "../utils/audio-src";

loadFont("normal", {
    weights: ["400", "700", "800", "900"],
});

interface KidsEduSlideProps {
    lines: string[];
    backgroundImageUrls?: string[];
    durationInSeconds: number;
    narrationUrl?: string;
}

const BG_TRANSITION_DURATION = 20; // ~0.67s at 30fps

// Cycle through different transitions for visual variety
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSITION_PRESETS: (() => any)[] = [
    () => slide({ direction: "from-bottom" }),
    () => wipe({ direction: "from-left" }),
    () => fade(),
    () => slide({ direction: "from-left" }),
    () => flip({ direction: "from-right" }),
    () => wipe({ direction: "from-top-left" }),
    () => slide({ direction: "from-right" }),
    () => fade(),
];

export const KidsEduSlide: React.FC<KidsEduSlideProps> = ({
    lines,
    backgroundImageUrls = [],
    durationInSeconds,
    narrationUrl,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // ─── Word Timing (character-proportional) ──────────────────────────
    const allWords = useMemo(() => {
        return lines.map((line) => line.split(" "));
    }, [lines]);

    const flatWords = useMemo(() => allWords.flat(), [allWords]);

    const totalFrames = durationInSeconds * fps;

    const wordTimingFrames = useMemo(() => {
        const totalChars = flatWords.reduce((sum, w) => sum + w.length, 0);
        if (totalChars === 0) return [];
        let cumulative = 0;
        return flatWords.map((word) => {
            const wordFrames = (word.length / totalChars) * totalFrames;
            const start = cumulative;
            cumulative += wordFrames;
            return { start, end: cumulative };
        });
    }, [flatWords, totalFrames]);

    // Current word global index
    let currentWordGlobalIndex = 0;
    for (let i = 0; i < wordTimingFrames.length; i++) {
        if (frame >= wordTimingFrames[i].start) {
            currentWordGlobalIndex = i;
        } else {
            break;
        }
    }

    // Find active line
    let wordCountSoFar = 0;
    let activeLineIndex = 0;
    let activeLineWordStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineWordCount = allWords[i].length;
        if (
            currentWordGlobalIndex >= wordCountSoFar &&
            currentWordGlobalIndex < wordCountSoFar + lineWordCount
        ) {
            activeLineIndex = i;
            activeLineWordStartIndex = wordCountSoFar;
            break;
        }
        wordCountSoFar += lineWordCount;
        if (i === lines.length - 1) {
            activeLineIndex = i;
            activeLineWordStartIndex = wordCountSoFar - lineWordCount;
        }
    }

    const currentLineWords = allWords[activeLineIndex] || [];
    const currentWordLocalIndex = currentWordGlobalIndex - activeLineWordStartIndex;

    // Line entrance frame — when the first word of this line appears
    const lineEntranceFrame = wordTimingFrames[activeLineWordStartIndex]?.start ?? 0;

    // ─── Background Image Cycling ──────────────────────────────────────
    const IMAGE_DURATION_IN_SECONDS = 4.5;
    const imageDurationInFrames = Math.round(IMAGE_DURATION_IN_SECONDS * fps);

    return (
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
            {/* ════════ BACKGROUND LAYER ════════ */}
            {backgroundImageUrls.length > 0 ? (
                <TransitionSeries>
                    {Array.from({
                        length:
                            Math.ceil(
                                (totalFrames - imageDurationInFrames) /
                                (imageDurationInFrames - BG_TRANSITION_DURATION),
                            ) + 2,
                    }).map((_, i) => {
                        const imageIndex = i % backgroundImageUrls.length;
                        const url = backgroundImageUrls[imageIndex];
                        const transitionIndex = i % TRANSITION_PRESETS.length;
                        const isLast =
                            i >=
                            Math.ceil(
                                (totalFrames - imageDurationInFrames) /
                                (imageDurationInFrames - BG_TRANSITION_DURATION),
                            ) + 1;

                        return (
                            <React.Fragment key={i}>
                                <TransitionSeries.Sequence
                                    durationInFrames={imageDurationInFrames}
                                >
                                    <KenBurnsImage
                                        src={url}
                                        durationInFrames={imageDurationInFrames}
                                        direction={i % 4}
                                    />
                                </TransitionSeries.Sequence>

                                {!isLast && (
                                    <TransitionSeries.Transition
                                        presentation={TRANSITION_PRESETS[transitionIndex]()}
                                        timing={springTiming({
                                            config: { damping: 200 },
                                            durationInFrames: BG_TRANSITION_DURATION,
                                        })}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </TransitionSeries>
            ) : (
                <AbsoluteFill
                    style={{
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                />
            )}

            {/* ════════ GRADIENT OVERLAY ════════ */}
            <AbsoluteFill
                style={{
                    background:
                        "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 40%, transparent 60%)",
                    zIndex: 5,
                }}
            />

            {/* ════════ TEXT LAYER ════════ */}
            <AbsoluteFill
                style={{
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingBottom: 160,
                    paddingLeft: 40,
                    paddingRight: 40,
                    zIndex: 10,
                }}
            >
                {/* Glassmorphism pill container */}
                <div
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.45)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderRadius: 24,
                        padding: "28px 36px",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                        maxWidth: "95%",
                    }}
                >
                    <div
                        style={{
                            fontFamily,
                            fontSize: 76,
                            fontWeight: 800,
                            textAlign: "center",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            gap: "12px 14px",
                            lineHeight: 1.2,
                        }}
                    >
                        {currentLineWords.map((word, i) => {
                            const globalIdx = activeLineWordStartIndex + i;
                            const wordStartFrame =
                                wordTimingFrames[globalIdx]?.start ?? 0;

                            return (
                                <AnimatedWord
                                    key={`${activeLineIndex}-${i}`}
                                    word={word}
                                    isActive={i === currentWordLocalIndex}
                                    isPast={i < currentWordLocalIndex}
                                    isFuture={i > currentWordLocalIndex}
                                    wordStartFrame={wordStartFrame}
                                    lineEntranceFrame={lineEntranceFrame}
                                    wordIndex={i}
                                />
                            );
                        })}
                    </div>
                </div>
            </AbsoluteFill>

            {/* ════════ AUDIO ════════ */}
            {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
        </AbsoluteFill>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Ken Burns Image — Remotion-driven zoom + pan (NO CSS keyframes)
// ═══════════════════════════════════════════════════════════════════════════════
const KenBurnsImage: React.FC<{
    src: string;
    durationInFrames: number;
    direction: number;
}> = ({ src, durationInFrames, direction }) => {
    const frame = useCurrentFrame();

    // Each direction combination creates a different Ken Burns feel
    const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.2], {
        extrapolateRight: "clamp",
    });

    const panX = interpolate(
        frame,
        [0, durationInFrames],
        direction % 2 === 0 ? [0, -3] : [-3, 0],
        { extrapolateRight: "clamp" },
    );

    const panY = interpolate(
        frame,
        [0, durationInFrames],
        direction < 2 ? [0, -2] : [-2, 0],
        { extrapolateRight: "clamp" },
    );

    return (
        <AbsoluteFill>
            <Img
                src={src}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${scale}) translate(${panX}%, ${panY}%)`,
                }}
            />
            {/* Tint overlay for depth */}
            <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />
        </AbsoluteFill>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Animated Word — Bouncy pop-in + active pulse
// ═══════════════════════════════════════════════════════════════════════════════
const AnimatedWord: React.FC<{
    word: string;
    isActive: boolean;
    isPast: boolean;
    isFuture: boolean;
    wordStartFrame: number;
    lineEntranceFrame: number;
    wordIndex: number;
}> = ({ word, isActive, isPast, isFuture, wordStartFrame, lineEntranceFrame, wordIndex }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // ── Staggered entrance animation ──
    // Each word pops in with a slight stagger when its line becomes active
    const entranceDelay = lineEntranceFrame + wordIndex * 2; // 2-frame stagger per word
    const entranceProgress = spring({
        fps,
        frame,
        delay: entranceDelay,
        config: {
            damping: 8,      // Low damping = bouncy
            stiffness: 180,
            mass: 0.6,
        },
        durationInFrames: 18,
    });

    // Scale: pop from 0 → overshoot → settle
    const entranceScale = interpolate(entranceProgress, [0, 1], [0, 1]);
    // Slide up from below
    const entranceY = interpolate(entranceProgress, [0, 1], [30, 0]);
    // Fade in
    const entranceOpacity = interpolate(entranceProgress, [0, 0.3], [0, 1], {
        extrapolateRight: "clamp",
    });

    // ── Active word pulse ──
    const activeSpring = spring({
        fps,
        frame,
        delay: wordStartFrame,
        config: {
            damping: 6,       // Bouncy!
            stiffness: 200,
            mass: 0.5,
        },
        durationInFrames: 14,
    });

    // Active word gets a scale bump
    const activeScale = isActive
        ? interpolate(activeSpring, [0, 1], [1.0, 1.18])
        : 1.0;

    // Active word bounces up slightly
    const activeY = isActive
        ? interpolate(activeSpring, [0, 0.5, 1], [0, -6, 0])
        : 0;

    // Combined transforms
    const finalScale = entranceScale * activeScale;
    const finalY = entranceY + activeY;

    // ── Color logic ──
    let color = "rgba(255, 255, 255, 0.4)"; // future: dimmed
    if (isActive) {
        color = "#39E508"; // active: viral green
    } else if (isPast) {
        color = "#ffffff"; // past: white
    }

    // Text shadow glow for active word
    const textShadow = isActive
        ? "0 0 20px rgba(57, 229, 8, 0.6), 0 0 40px rgba(57, 229, 8, 0.3), 0 4px 8px rgba(0,0,0,0.5)"
        : "0 2px 6px rgba(0,0,0,0.5)";

    return (
        <span
            style={{
                display: "inline-block",
                color,
                transform: `translateY(${finalY}px) scale(${finalScale})`,
                opacity: entranceOpacity,
                textShadow,
                whiteSpace: "pre",
                willChange: "transform, opacity",
            }}
        >
            {word}
        </span>
    );
};
