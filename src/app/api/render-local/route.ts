import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

// Store render progress in memory (for simplicity)
const renderProgress: Map<string, { progress: number; status: string; outputPath?: string; error?: string }> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { compositionId, inputProps, saveAs } = body;

    if (!compositionId) {
      return NextResponse.json({ error: "compositionId is required" }, { status: 400 });
    }

    // Generate unique render ID
    const renderId = `render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    // Initialize progress
    renderProgress.set(renderId, { progress: 0, status: "bundling" });

    // Start render in background
    renderInBackground(renderId, compositionId, inputProps, saveAs);

    return NextResponse.json({
      renderId,
      message: "Render started",
    });
  } catch (error) {
    console.error("Local render error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start render" },
      { status: 500 }
    );
  }
}

async function renderInBackground(renderId: string, compositionId: string, inputProps: unknown, saveAs: string) {
  try {
    // Create output directory
    const outputDir = path.join(process.cwd(), "out");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${renderId}.mp4`);

    renderProgress.set(renderId, { progress: 0.05, status: "bundling" });

    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), "src/remotion/index.ts"),
      publicDir: path.join(process.cwd(), "public"),
      onProgress: (progress) => {
        renderProgress.set(renderId, { 
          progress: 0.05 + (progress / 100) * 0.15, 
          status: "bundling" 
        });
      },
    });

    renderProgress.set(renderId, { progress: 0.2, status: "preparing" });

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: inputProps as Record<string, unknown>,
      chromiumOptions: { gl: "swangle" },
    });

    renderProgress.set(renderId, { progress: 0.25, status: "rendering" });

    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: inputProps as Record<string, unknown>,
      chromiumOptions: { gl: "swangle" }, // Change "swangle" to "angle" if not using docker
      onProgress: ({ progress }) => {
        renderProgress.set(renderId, {
          progress: 0.25 + progress * 0.75,
          status: "rendering",
        });
      },
    });

    // Mark as done
    renderProgress.set(renderId, {
      progress: 1,
      status: "done",
      outputPath: `/out/${renderId}.mp4`, // Use renderId for the file path on disk
    });

    // console.log(`✅ Render complete: ${outputPath}`);
  } catch (error) {
    console.error("Render error:", error);
    renderProgress.set(renderId, {
      progress: 0,
      status: "error",
      error: error instanceof Error ? error.message : "Render failed",
    });
  }
}

// GET endpoint to check progress
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const renderId = searchParams.get("renderId");

  if (!renderId) {
    return NextResponse.json({ error: "renderId is required" }, { status: 400 });
  }

  const progress = renderProgress.get(renderId);

  if (!progress) {
    return NextResponse.json({ error: "Render not found" }, { status: 404 });
  }

  return NextResponse.json(progress);
}
