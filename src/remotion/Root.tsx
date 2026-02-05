import { Composition } from "remotion";
import {
    COMP_NAME,
    defaultEduCompProps,
    defaultMyCompProps,
    DURATION_IN_FRAMES,
    EDU_COMP_NAME,
    TimelineSchema,
    VIDEO_FPS,
    VIDEO_HEIGHT,
    VIDEO_WIDTH,
} from "../../types/constants";
import { calculateTimelineDuration, EduMain } from "./EduComp/Main";
import { Main } from "./MyComp/Main";
import { NextLogo } from "./MyComp/NextLogo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMP_NAME}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id="NextLogo"
        component={NextLogo}
        durationInFrames={300}
        fps={30}
        width={140}
        height={140}
        defaultProps={{
          outProgress: 0,
        }}
      />
      <Composition
        id={EDU_COMP_NAME}
        component={EduMain}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={TimelineSchema}
        defaultProps={defaultEduCompProps}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: calculateTimelineDuration(props.slides, VIDEO_FPS),
          };
        }}
      />
    </>
  );
};
