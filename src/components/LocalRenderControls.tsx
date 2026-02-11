import React from "react";
import type { Timeline } from "../../types/edu";
import type { QuizTimeline, SingleQuizTimeline } from "../../types/quiz";
import { useLocalRendering } from "../helpers/use-local-rendering";
import { Button } from "./Button";
import { InputContainer } from "./Container";
import { ErrorComp } from "./Error";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "./Spacing";


export const LocalRenderControls: React.FC<{
  compositionId: string;
  inputProps: Timeline | QuizTimeline | SingleQuizTimeline;
}> = ({ compositionId, inputProps }) => {
  const [saveAs,setSaveAs] = React.useState("")
  const { renderMedia, state, undo } = useLocalRendering(compositionId, inputProps, saveAs);

  return (
  <InputContainer>
  {state.status === "init" ||
  state.status === "invoking" ||
  state.status === "error" ? (
    <>
      <div className="text-slate-400 text-sm mb-4">
        Videos will be saved to the <code className="bg-slate-800 px-2 py-1 rounded">/out</code> folder
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        <label htmlFor="saveAs" className="text-slate-400 text-sm flex items-center gap-2 flex-1 min-w-0">
          <span className="whitespace-nowrap">Save as:</span>
          <input 
            type="text" 
            placeholder="Enter a name for your video" 
            value={saveAs} 
            onChange={(e) => setSaveAs(e.target.value)}
            className="flex-1 min-w-0 border border-slate-700 rounded px-2 py-1"
            required
          />
        </label>

        <Button
          disabled={state.status === "invoking" || saveAs === ""}
          loading={state.status === "invoking"}
          onClick={renderMedia}
        >
          {state.status === "invoking" ? "Starting..." : "Render Locally"}
        </Button>
      </div>
      
      {state.status === "error" ? (
        <ErrorComp message={state.error.message}></ErrorComp>
      ) : null}
    </>
  ) : null}
  
  {state.status === "rendering" ? (
    <>
      <div className="text-slate-300 text-sm mb-2">
        Rendering video... {Math.round(state.progress * 100)}%
      </div>
      <ProgressBar progress={state.progress} />
      <Spacing></Spacing>
    </>
  ) : null}
  
  {state.status === "done" ? (
    <>
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <p className="text-green-400 font-medium">Render Complete!</p>
          <p className="text-slate-400 text-sm">
            Saved to: <code className="bg-slate-800 px-1 rounded">{state.outputPath}. Click Download Video to download the video</code>
          </p>
        </div>
      </div>
      <Spacing></Spacing>
      <div className="flex items-center justify-end gap-2">
        <a 
          href={`/api/download-video?renderId=${state.renderId}&filename=${saveAs || "video"}`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Video
        </a>
        <Button onClick={undo}>Render Another</Button>
      </div>
    </>
  ) : null}
</InputContainer>
  );
};
