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
import { createTikTokStyleCaptions } from "@remotion/captions";
import { getAudioSrc } from "../utils/audio-src";
import type { CaptionData } from "../../../types/edu-kids";

loadFont("normal", {
    weights: ["400", "700", "800", "900"],
});

interface KidsEduSlideProps {
    lines: string[];
    backgroundImageUrls?: string[];
    durationInSeconds: number;
    narrationUrl?: string;
    captions?: CaptionData[];
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
    captions,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // ─── Word Timing Logic ───

    // 1. Whisper Captions (Primary)
    const { pages } = useMemo(() => {
        if (!captions || captions.length === 0) {
            console.log("❌ No captions provided to KidsEduSlide");
            return { pages: [] };
        }
        const result = createTikTokStyleCaptions({
            captions,
            combineTokensWithinMilliseconds: 3000,
        });
        console.log("✅ Generated TikTok Pages:", result.pages.length);
        return result;
    }, [captions]);

    // 2. Fallback (Character Proportional)
    const allWords = useMemo(() => lines.map((line) => line.split(" ")), [lines]);
    const flatWords = useMemo(() => allWords.flat(), [allWords]);

    const totalFrames = durationInSeconds * fps;

    // Determine what to display
    let displayWords: { text: string; startFrame: number; endFrame: number }[] = [];
    let currentLocalIndex = -1;
    let lineStartFrame = 0;
    let activePage: any = null;

    if (captions && pages.length > 0) {
        // ─── A. Whisper Algo ───
        const currentTimeMs = (frame / fps) * 1000;
        activePage = pages.find((p) => currentTimeMs >= p.startMs && currentTimeMs < (p.startMs + p.durationMs)) || null;

        if (activePage) {
            displayWords = activePage.tokens.map((t: any) => ({
                text: t.text,
                startFrame: (t.fromMs / 1000) * fps,
                endFrame: (t.toMs / 1000) * fps,
            }));
            lineStartFrame = (activePage.startMs / 1000) * fps;

            // Find which word is active
            // Note: whisper tokens are continuous in time (mostly). 
            // If frame is between two words (silence), we keep the previous word active or none? 
            // TikTok style usually highlights correctly.
            currentLocalIndex = displayWords.findIndex(
                (w) => frame >= w.startFrame && frame < w.endFrame
            );

            // If we are in the page but not on a specific word (gap), 
            // check if we are past a word to mark it as "past"
            if (currentLocalIndex === -1) {
                // all words whose endFrame < frame are past
                const firstFuture = displayWords.findIndex(w => frame < w.startFrame);
                currentLocalIndex = firstFuture === -1 ? displayWords.length : firstFuture - 1;
                // if currentLocalIndex is -1, it means we are before the first word of the page (but in page time?)
            }
        }
    } else {
        // ─── B. Fallback Algo ───
        const totalChars = flatWords.reduce((sum, w) => sum + w.length, 0);

        // Calculate timing frames for all words (only if needed)
        const wordTimingFrames: { start: number; end: number }[] = [];
        if (totalChars > 0) {
            let cumulative = 0;
            for (const word of flatWords) {
                const wordFrames = (word.length / totalChars) * totalFrames;
                wordTimingFrames.push({
                    start: cumulative,
                    end: cumulative + wordFrames,
                });
                cumulative += wordFrames;
            }
        }

        // Find global index
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

        const currentLineWordsFallback = allWords[activeLineIndex] || [];
        lineStartFrame = wordTimingFrames[activeLineWordStartIndex]?.start ?? 0;
        currentLocalIndex = currentWordGlobalIndex - activeLineWordStartIndex;

        displayWords = currentLineWordsFallback.map((w, i) => {
            const gIdx = activeLineWordStartIndex + i;
            const tf = wordTimingFrames[gIdx];
            return {
                text: w,
                startFrame: tf?.start ?? 0,
                endFrame: tf?.end ?? 0,
            };
        });

        if (displayWords.length > 0) {
            activePage = {
                startMs: (displayWords[0].startFrame / fps) * 1000,
                durationMs: ((displayWords[displayWords.length - 1].endFrame - displayWords[0].startFrame) / fps) * 1000
            };
        }
    }

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
                    justifyContent: "center",
                    alignItems: "center",
                    paddingLeft: 40,
                    paddingRight: 40,
                    zIndex: 10,
                }}
            >
                {/* Glassmorphism pill container */}
                {activePage && (
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
                            // Smooth entrance/exit
                            opacity: interpolate(
                                (frame / fps) * 1000,
                                [
                                    activePage.startMs,
                                    activePage.startMs + 150,
                                    activePage.startMs + activePage.durationMs - 150,
                                    activePage.startMs + activePage.durationMs
                                ],
                                [0, 1, 1, 0],
                                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                            ),
                            transform: `scale(${interpolate(
                                (frame / fps) * 1000,
                                [activePage.startMs, activePage.startMs + 300],
                                [0.9, 1],
                                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                            )})`,
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
                            {displayWords.map((wordObj, i) => (
                                <AnimatedWord
                                    key={`${i}-${wordObj.text}`}
                                    word={wordObj.text}
                                    isActive={i === currentLocalIndex}
                                    isPast={i < currentLocalIndex}
                                    isFuture={i > currentLocalIndex}
                                    wordStartFrame={wordObj.startFrame}
                                    lineEntranceFrame={lineStartFrame}
                                    wordIndex={i}
                                />
                            ))}
                        </div>
                    </div>
                )}
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

    // ── Active word styles ──
    const activeScale = 1.0;
    const activeY = 0;

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
