"use client";

import { Player, PlayerRef } from "@remotion/player";
import canvasConfetti from "canvas-confetti";
import type { NextPage } from "next";
import { useCallback, useMemo, useRef, useState } from "react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
  const playerRef = useRef<PlayerRef>(null);

  //Calculates the total length for constant given fps
  const durationInFrames = useMemo(
    () => calculateTimelineDuration(timeline.slides, VIDEO_FPS),
    [timeline]
  );

  //Seek to a specific slide
  const seekToSlide = useCallback((index: number) => {
    if (!playerRef.current) return;
    
    let frame = 0;
    for (let i = 0; i < index; i++) {
      frame += timeline.slides[i].durationInSeconds * VIDEO_FPS;
    }
    playerRef.current.seekTo(frame);
  }, [timeline]);

  //TIMELINE SLIDE ORDER HANDLER
  const moveSlide = useCallback((index: number, direction: "up" | "down") => {
    setTimeline((prev) => {
      const newSlides = [...prev.slides];
      if (direction === "up" && index > 0) {
        [newSlides[index], newSlides[index - 1]] = [newSlides[index - 1], newSlides[index]];
      } else if (direction === "down" && index < newSlides.length - 1) {
        [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
      }
      return { ...prev, slides: newSlides };
    });
  }, []);

  //FILE HANDLER
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

  //API ENDPOINTS
   const handleEdit = useCallback(async () => {
    if (!editPrompt.trim()) {
      setError("Please enter an edit instruction");
      return;
    }

    setIsGenerating(true);
    setLoadingMessage("Editing video timeline...");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("timeline", JSON.stringify(timeline));
      formData.append("prompt", editPrompt);
      if (pdfFile) {
        formData.append("pdf", pdfFile);
      }

      const response = await fetch("/api/generate", {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to edit timeline";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
             // Fallback error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const parsed = TimelineSchema.safeParse(data.timeline);
      if (!parsed.success) {
        throw new Error("Invalid timeline format received from server");
      }

      setTimeline(parsed.data);
      toast.success("Video edited successfully!");
      setIsEditing(false);
      setEditPrompt("");
      canvasConfetti();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsGenerating(false);
      setLoadingMessage("");
    }
  }, [timeline, editPrompt]);

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Preview</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-sm font-medium transition-colors border border-purple-500/30 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {isEditing ? "Cancel Edit" : "Edit Video"}
            </button>
          </div>

          {/* Edit Input */}
          <div className={`overflow-hidden transition-all duration-300 ${isEditing ? "max-h-48 mb-6 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="flex gap-4">
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe your changes... (e.g., 'Make the intro shorter', 'Add a slide about space', 'Change background to blue')"
                className="flex-1 px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
              <button
                onClick={handleEdit}
                disabled={isGenerating || !editPrompt.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                     <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                     </svg>
                     Applying...
                  </>
                ) : (
                  "Apply Changes"
                )}
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl shadow-2xl">
            <Player
              ref={playerRef}
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
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden mb-8 transition-all duration-300">
          <button 
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span>📋</span> Timeline: {timeline.title}
              <span className="text-sm font-normal text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                {timeline.slides.length} slides
              </span>
            </h2>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-6 w-6 text-slate-400 transition-transform duration-300 ${isTimelineExpanded ? "rotate-180" : ""}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className={`transition-all duration-300 ${isTimelineExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="p-6 pt-0 space-y-2 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {timeline.slides.map((slide, index) => (
                <div
                  key={index}
                  onClick={() => seekToSlide(index)}
                  className="group flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer hover:bg-black/30"
                >
                  <span className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs font-medium text-slate-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                    {index + 1}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {slide.type === "intro" && <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-400 bg-fuchsia-400/10 px-2 py-0.5 rounded">Intro</span>}
                      {slide.type === "outro" && <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-400 bg-fuchsia-400/10 px-2 py-0.5 rounded">Outro</span>}
                      {slide.type === "text" && <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Text</span>}
                      {slide.type === "bullets" && <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Bullets</span>}
                      {slide.type === "diagram" && <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">Diagram</span>}
                      {slide.type === "image" && <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">Image</span>}
                      {slide.type === "lottie" && <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Lottie</span>}
                      {slide.type === "threeD" && <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-2 py-0.5 rounded">3D</span>}
                      
                      <span className="text-xs text-slate-500 font-mono">
                        {slide.durationInSeconds}s
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-300 truncate">
                      {slide.type === "intro" && slide.title}
                      {slide.type === "outro" && (slide.title || slide.callToAction || "End")}
                      {slide.type === "text" && slide.text}
                      {slide.type === "bullets" && (slide.title || slide.bullets[0])}
                      {slide.type === "diagram" && (slide.title || `${slide.nodes.length} nodes`)}
                      {slide.type === "image" && (slide.imageQuery || "Visual")}
                      {slide.type === "lottie" && `Animation: ${slide.animationType}`}
                      {slide.type === "threeD" && `3D Model`}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => moveSlide(index, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      title="Move Up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => moveSlide(index, "down")}
                      disabled={index === timeline.slides.length - 1}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      title="Move Down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
