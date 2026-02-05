"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import { useCallback, useMemo, useState } from "react";
import {
  defaultEduCompProps,
  EDU_COMP_NAME,
  TimelineSchema,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  type Timeline,
} from "../../types/constants";
import { LocalRenderControls } from "../components/LocalRenderControls";
import { Spacing } from "../components/Spacing";
import { calculateTimelineDuration, EduMain } from "../remotion/EduComp/Main";

const Home: NextPage = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [timeline, setTimeline] = useState<Timeline>(defaultEduCompProps);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationInFrames = useMemo(
    () => calculateTimelineDuration(timeline.slides, VIDEO_FPS),
    [timeline]
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate timeline");
      }

      const data = await response.json();
      const parsed = TimelineSchema.safeParse(data.timeline);

      if (!parsed.success) {
        throw new Error("Invalid timeline format");
      }

      setTimeline(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-screen-lg m-auto py-8 px-4">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Educational Video Generator
          </h1>
          <p className="text-slate-400">
            Enter a prompt to generate animated educational presentations
          </p>
        </header>

        {/* Prompt Input Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Enter your topic or concept (Right now the animations are hardcoded json format, Only 3 mentioned below work for now. Would need to implement a way to generate these json format based on the prompt through AI)
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. water cycle, photosynthesis, machine learning..."
            className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="ml-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Video"
              )}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
          <div className="overflow-hidden rounded-xl shadow-2xl">
            <Player
              component={EduMain}
              inputProps={timeline}
              durationInFrames={durationInFrames}
              fps={VIDEO_FPS}
              compositionHeight={VIDEO_HEIGHT}
              compositionWidth={VIDEO_WIDTH}
              style={{ width: "100%" }}
              controls
            />
          </div>
        </div>

        {/* Timeline Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Timeline: {timeline.title}
          </h2>
          <div className="space-y-2">
            {timeline.slides.map((slide, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-slate-300"
              >
                <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-sm font-medium text-purple-400">
                  {index + 1}
                </span>
                <span className="capitalize text-sm">
                  {slide.type === "text" && `Text: "${slide.text.slice(0, 40)}..."`}
                  {slide.type === "bullets" && `Bullets: ${slide.title || "List"}`}
                  {slide.type === "diagram" && `Diagram: ${slide.title || "Flow"}`}
                  {slide.type === "threeD" && `3D: ${slide.shape || "cube"}`}
                </span>
                <span className="ml-auto text-slate-500 text-sm">
                  {slide.durationInSeconds}s
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Render Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Export Video
          </h2>
          <LocalRenderControls
            compositionId={EDU_COMP_NAME}
            inputProps={timeline}
          />
        </div>

        <Spacing />
      </div>
    </div>
  );
};

export default Home;
