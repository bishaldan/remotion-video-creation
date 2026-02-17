import { Composition } from "remotion";
import {
  defaultEduCompProps,
  EDU_COMP_NAME,
  TimelineSchema
} from "../../types/edu";
import {
  defaultKidsTimeline,
  EDU_KIDS_COMP_NAME,
  EDU_KIDS_HEIGHT,
  EDU_KIDS_WIDTH,
  KidsTimelineSchema,
} from "../../types/edu-kids";
import {
  defaultDualQuizTimeline,
  defaultSingleQuizTimeline,
  DualQuizTimelineSchema,
  QUIZ_COMP_LANDSCAPE,
  QUIZ_COMP_PORTRAIT,
  QUIZ_HEIGHT_LANDSCAPE,
  QUIZ_HEIGHT_PORTRAIT,
  QUIZ_WIDTH_LANDSCAPE,
  QUIZ_WIDTH_PORTRAIT,
  SINGLE_QUIZ_COMP,
  SINGLE_QUIZ_HEIGHT,
  SINGLE_QUIZ_WIDTH,
  SingleQuizTimelineSchema
} from "../../types/quiz";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH
} from "../../types/shared";
import { calculateKidsDuration, EduKidsMain } from "./compositions/EduKids/Main";
import { calculateQuizDuration, DualQuizMain } from "./compositions/DualQuiz/Main";
import { calculateTimelineDuration, EduMain } from "./compositions/Edu/Main";
import { calculateSingleQuizDuration, SingleQuizMain } from "./compositions/SingleQuiz/Main";

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
        id={EDU_KIDS_COMP_NAME}
        component={EduKidsMain}
        durationInFrames={calculateKidsDuration(defaultKidsTimeline.slides)}
        fps={VIDEO_FPS}
        width={EDU_KIDS_WIDTH}
        height={EDU_KIDS_HEIGHT}
        schema={KidsTimelineSchema}
        defaultProps={defaultKidsTimeline}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: calculateKidsDuration(props.slides),
          };
        }}
      />
      <Composition
        id={QUIZ_COMP_LANDSCAPE}
        component={DualQuizMain}
        fps={VIDEO_FPS}
        width={QUIZ_WIDTH_LANDSCAPE}
        height={QUIZ_HEIGHT_LANDSCAPE}
        schema={DualQuizTimelineSchema}
        defaultProps={{
          ...defaultDualQuizTimeline,
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
        component={DualQuizMain}
        fps={VIDEO_FPS}
        width={QUIZ_WIDTH_PORTRAIT}
        height={QUIZ_HEIGHT_PORTRAIT}
        schema={DualQuizTimelineSchema}
        defaultProps={{
          ...defaultDualQuizTimeline,
          orientation: "portrait",
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: calculateQuizDuration(props.slides, VIDEO_FPS),
          };
        }}
      />
      <Composition
        id={SINGLE_QUIZ_COMP}
        component={SingleQuizMain}
        fps={VIDEO_FPS}
        width={SINGLE_QUIZ_WIDTH}
        height={SINGLE_QUIZ_HEIGHT}
        schema={SingleQuizTimelineSchema}
        defaultProps={defaultSingleQuizTimeline}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: calculateSingleQuizDuration(props.slides, VIDEO_FPS),
          };
        }}
      />
    </>
  );
};

