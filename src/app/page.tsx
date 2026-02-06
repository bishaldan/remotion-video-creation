"use client";

import { Player } from "@remotion/player";
import canvasConfetti from "canvas-confetti";
import type { NextPage } from "next";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
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
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"prompt" | "pdf">("prompt");

  const durationInFrames = useMemo(
    () => calculateTimelineDuration(timeline.slides, VIDEO_FPS),
    [timeline]
  );

  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      // Switching back to prompt mode - clear PDF state
      setPdfFile(null);
      setUploadMode("prompt");
      setError(null);
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setError("Please select a valid PDF file");
      setPdfFile(null);
      setUploadMode("prompt");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError("File size exceeds 10MB limit");
      setPdfFile(null);
      setUploadMode("prompt");
      return;
    }

    // File is valid - switch to PDF mode and clear prompt
    setPdfFile(file);
    setUploadMode("pdf");
    setPrompt(""); // Clear previous prompt when switching to PDF mode
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleGenerate = useCallback(async () => {
    // Validate that either PDF or prompt is provided
    if (!pdfFile && !prompt.trim()) {
      setError("Please upload a PDF or enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let response: Response;

      // Check if PDF file is present
      if (pdfFile) {
        // Set loading message for PDF extraction
        setLoadingMessage("Extracting PDF content...");
        
        // Create FormData for PDF upload
        const formData = new FormData();
        
        try {
          // Handle file read errors - verify file is still accessible
          if (!pdfFile.size || pdfFile.size === 0) {
            throw new Error("The selected PDF file is empty or unreadable");
          }
          
          formData.append("pdf", pdfFile);
          
          // Append text prompt if provided (as supplementary context)
          if (prompt.trim()) {
            formData.append("prompt", prompt.trim());
          }
        } catch (fileError) {
          // Handle file read errors
          throw new Error(
            fileError instanceof Error 
              ? fileError.message
              : "Failed to read PDF file. Please try selecting the file again."
          );
        }

        // Send FormData (no Content-Type header - browser sets it with boundary)
        // Note: PDF extraction happens on server, then AI generation
        try {
          response = await fetch("/api/generate", {
            method: "POST",
            body: formData,
          });
        } catch {
          // Handle network errors specifically for PDF upload
          throw new Error(
            "Network error during PDF upload. Please check your connection and try again."
          );
        }
        
        // Update loading message to generation phase after extraction completes
        setLoadingMessage("Generating video timeline...");
      } else {
        // Set loading message for generation
        setLoadingMessage("Generating video timeline...");
        
        // Maintain JSON request for text-only mode (backward compatibility)
        try {
          response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });
        } catch {
          // Handle network errors for text prompt
          throw new Error(
            "Network error. Please check your connection and try again."
          );
        }
      }

      if (!response.ok) {
        // Display error messages from API
        let errorMessage = "Failed to generate timeline";
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use status-based messages
          if (response.status === 400) {
            errorMessage = "Invalid request. Please check your input and try again.";
          } else if (response.status === 413) {
            errorMessage = "File size too large. Please use a smaller PDF file.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (response.status === 503) {
            errorMessage = "Service temporarily unavailable. Please try again later.";
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const parsed = TimelineSchema.safeParse(data.timeline);

      if (!parsed.success) {
        throw new Error("Invalid timeline format received from server");
      }

      setTimeline(parsed.data);
      toast.success("Video generated successfully!");
      canvasConfetti();
    } catch (err) {
      // Handle all errors with appropriate messages
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
      setLoadingMessage("");
    }
  }, [prompt, pdfFile]);

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
          {/* PDF Upload Section */}
          <div className="mb-6">
            <label
              htmlFor="pdf-upload"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Upload PDF Document (Optional)
            </label>
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex items-center gap-3 transition-all duration-200 ${
                  isDragging ? "scale-[1.02]" : ""
                }`}
              >
                <label
                  htmlFor="pdf-upload"
                  className="flex-1 cursor-pointer"
                >
                  <div
                    className={`flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border rounded-xl text-slate-400 transition-all duration-200 ${
                      isDragging
                        ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                        : "border-white/10 hover:bg-white/10 hover:border-purple-500/50"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm">
                      {isDragging
                        ? "Drop PDF here"
                        : pdfFile
                          ? "Change PDF"
                          : "Choose PDF File or Drag & Drop"}
                    </span>
                  </div>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Display selected file info */}
              {pdfFile && (
                <div className="flex items-center justify-between px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {pdfFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFileSelect(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Remove PDF"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-slate-400 hover:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          {pdfFile && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Or add context
              </span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>
          )}

          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            {uploadMode === "pdf" 
              ? "Additional Context (Optional)" 
              : "Enter your topic or concept"}
          </label>

          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              uploadMode === "pdf"
                ? "Add supplementary context for the PDF (optional)"
                : "e.g. water cycle, photosynthesis, machine learning..."
            }
            className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {loadingMessage || "Generating..."}
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
