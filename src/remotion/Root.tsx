import { Composition } from "remotion";
import {
  defaultEduCompProps,
  defaultQuizTimeline,
  EDU_COMP_NAME,
  QUIZ_COMP_LANDSCAPE,
  QUIZ_COMP_PORTRAIT,
  QUIZ_HEIGHT_LANDSCAPE,
  QUIZ_HEIGHT_PORTRAIT,
  QUIZ_WIDTH_LANDSCAPE,
  QUIZ_WIDTH_PORTRAIT,
  QuizTimelineSchema,
  TimelineSchema,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH
} from "../../types/constants";
import { calculateTimelineDuration, EduMain } from "./EduComp/Main";


import { calculateQuizDuration, QuizMain } from "./QuizComp/Main";

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
      <Composition
        id={QUIZ_COMP_LANDSCAPE}
        component={QuizMain}
        fps={VIDEO_FPS}
        width={QUIZ_WIDTH_LANDSCAPE}
        height={QUIZ_HEIGHT_LANDSCAPE}
        schema={QuizTimelineSchema}
        defaultProps={{
          ...defaultQuizTimeline,
          orientation: "landscape",
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: calculateQuizDuration(props.slides, VIDEO_FPS),
          };
        }}
      />
      <Composition
        id={QUIZ_COMP_PORTRAIT}
        component={QuizMain}
        fps={VIDEO_FPS}
        width={QUIZ_WIDTH_PORTRAIT}
        height={QUIZ_HEIGHT_PORTRAIT}
        schema={QuizTimelineSchema}
        defaultProps={{
          ...defaultQuizTimeline,
          orientation: "portrait",
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: calculateQuizDuration(props.slides, VIDEO_FPS),
          };
        }}
      />
    </>
  );
};
