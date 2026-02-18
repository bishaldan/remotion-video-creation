import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { KidsTimelineSchema } from "../../../../types/edu-kids";
import { VIDEO_FPS } from "../../../../types/shared";
import { KidsEduSlide } from "../../templates/KidsEduSlide";
import { IntroSlide } from "../../templates/IntroSlide";
import { OutroSlide } from "../../templates/OutroSlide";

const TRANSITION_DURATION = 15;

export const EduKidsMain: React.FC<z.infer<typeof KidsTimelineSchema>> = ({
    slides,
}) => {
    const renderSlide = (slide: any) => {
        switch (slide.type) {
            case "intro":
                return (
                    <IntroSlide
                        title={slide.title}
                        subtitle={slide.subtitle}
                        author={slide.author}
                        backgroundColor={slide.backgroundColor}
                        narrationUrl={slide.narrationUrl}
                    />
                );
            case "kidsContent":
                return (
                    <KidsEduSlide
                        lines={slide.lines}
                        backgroundImageUrls={slide.backgroundImageUrls}
                        durationInSeconds={slide.durationInSeconds}
                        narrationUrl={slide.narrationUrl}
                    />
                );
            case "outro":
                return (
                    <OutroSlide
                        title={slide.title}
                        callToAction={slide.callToAction}
                        backgroundColor={slide.backgroundColor}
                        narrationUrl={slide.narrationUrl}
                    />
                );
            default:
                return null;
        }
    };

    // Calculate background music window (after intro, before outro)
    const introFrames = Math.round((slides[0]?.durationInSeconds || 5) * VIDEO_FPS);
    const outroFrames = Math.round((slides[slides.length - 1]?.durationInSeconds || 5) * VIDEO_FPS);
    const totalFrames = calculateKidsDuration(slides, VIDEO_FPS);

    // Background music plays during the whole video or just content?
    // User said "kid friendly content generator".
    // Let's play happy background music throughout, maybe ducking it?
    // Current implementation in other modes plays bg music between intro/outro.
    const bgMusicFrom = introFrames - TRANSITION_DURATION;
    const bgMusicDuration = Math.max(1, totalFrames - bgMusicFrom - outroFrames + TRANSITION_DURATION);

    return (
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
            <TransitionSeries>
                {slides.map((slide, index) => {
                    const durationInSeconds = slide.durationInSeconds || 10;
                    const durationInFrames = Math.round(durationInSeconds * VIDEO_FPS);

                    return (
                        <React.Fragment key={index}>
                            <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                                {renderSlide(slide)}
                            </TransitionSeries.Sequence>

                            {/* Add fade transitions between main slides */}
                            {index < slides.length - 1 && (
                                <TransitionSeries.Transition
                                    presentation={fade()}
                                    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </TransitionSeries>

            {/* Background music — plays between intro and outro */}
            <Sequence from={bgMusicFrom} durationInFrames={bgMusicDuration}>
                <Html5Audio
                    src={staticFile("audio/default/sfx/bg/kid.mp3")}
                    loop
                    volume={0.10}
                />
            </Sequence>
        </AbsoluteFill>
    );
};

export const calculateKidsDuration = (
    slides: any[],
    fps: number = VIDEO_FPS
): number => {
    const totalSlideFrames = slides.reduce((total, slide) => {
        const durationInSeconds = slide.durationInSeconds || 10;
        return total + Math.round(durationInSeconds * fps);
    }, 0);

    const transitionReduction = (slides.length - 1) * TRANSITION_DURATION;
    return Math.max(1, totalSlideFrames - transitionReduction);
};
