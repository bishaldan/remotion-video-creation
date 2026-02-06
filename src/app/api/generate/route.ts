import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { extractPDFContent } from "../../../lib/pdf-extractor";
import { buildPrompt } from "../../../lib/prompt-builder";

// Simple sanitization to handle potential Markdown code blocks in response
const cleanJsonResponse = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

const SYSTEM_PROMPT = `
You are an expert educational video content generator. Your goal is to create engageing, accurate, and structured educational video timelines based on user topics.

You will output a JSON object that matches the following TypeScript interface (do not include the interface definition, just the JSON):

\`\`\`typescript
type Slide =
  | {
      type: "text";
      text: string;
      animation: "typewriter" | "fadeIn" | "wordByWord"; // Default: fadeIn
      fontSize?: number;
      textColor?: string;
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "bullets";
      title?: string;
      bullets: string[];
      bulletIcon?: string; // Emoji or character
      textColor?: string;
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "diagram";
      title?: string;
      nodes: { id: string; label: string; x: number; y: number; color?: string; width?: number }[];
      arrows: { from: string; to: string; label?: string }[];
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "threeD";
      title?: string;
      shape: "cube" | "sphere" | "pyramid" | "torus";
      color?: string;
      backgroundColor?: string;
      durationInSeconds: number;
    };

interface Timeline {
  title: string;
  defaultSlideDuration: number;
  slides: Slide[];
}
\`\`\`

**Instructions:**
1.  **Research Deeply & Factual Truth:** The user will give a topic. You MUST cross-reference scientific facts before generating the timeline. For 3D scenes, ensure the objects, their proportions, and their positions reflect reality (e.g., number of electrons in a shell, relative size of planets).
2.  **Context & Constraints:**
    *   **Resolution:** 1920x1080 pixels.
    *   **FPS:** 30 frames per second.
    *   **Safe Area:** Keep critical elements within 100px padding (x: 100-1820, y: 100-980).
3.  **Structure:** Create 4-8 slides that explain the concept logically:
    *   **Introduction:** Use a "text" or "threeD" slide.
    *   **Breakdown:** Use "bullets" slides.
    *   **Visuals:** Use "diagram" slides. **CRITICAL:** Position nodes strictly within the safe area (x: 100-1820, y: 100-980).
    *   **Conclusion:** Summarize with a "text" slide.
4.  **Visuals:**
    *   **Background:** ALWAYS use "#ffffff" (white).
    *   **Text/Colors:** Use dark, high-contrast colors (e.g., "#1e293b").
    *   **3D Scenes (Data-Driven):** Build complex dioramas using the \`objects\` array in \`threeD\` slides.
        *   **Layout:** The 3D Canvas is **FULLSCREEN** with a top padding. The title is at the **TOP-MIDDLE**.
        *   **Centering:** The center of the 3D world is \`[0, 0, 0]\`. ALWAYS place the primary object (Nucleus/Sun) at \`[0, 0, 0]\`.
        *   **Stationary Paths:** Visible orbit rings (torus) MUST use \`animation: "none"\` and \`rotation: [1.57, 0, 0]\` so they remain fixed, flat, and perfectly circular.
        *   **Perspective:** For atoms or orbital motion, ALWAYS use \`cameraPosition: [0, 20, 0]\` (looking straight down).
        *   **Objects:** Use \`sphere\`, \`cube\`, \`pyramid\`, \`torus\` (use sparingly for special shells), \`cylinder\`.
5.  **Format:** Return ONLY valid JSON.

**Example Topic:** "Atomic Structure of Helium"
**Example Output Structure (ThreeD Slide):**
{
  "type": "threeD",
  "title": "Helium Atom Structure",
  "objects": [
    { "shape": "sphere", "color": "#ef4444", "position": [0,0,0], "scale": 1, "label": "Nucleus (2P+2N)", "animation": "pulse" },
    { "shape": "sphere", "color": "#3b82f6", "position": [2.5,0,0], "scale": 0.3, "label": "Electron", "animation": "orbit" },
    { "shape": "sphere", "color": "#3b82f6", "position": [-2.5,0,0], "scale": 0.3, "label": "Electron", "animation": "orbit" },
    { "shape": "torus", "color": "#94a3b8", "position": [0,0,0], "scale": 2.5, "rotation": [1.5,0,0], "animation": "none" }
  ],
  "durationInSeconds": 8
}
`;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    let prompt: string;
    let pdfText: string | undefined;
    let pdfMetadata: { title?: string; pageCount: number } | undefined;
    
    // Check if request contains FormData (PDF upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const pdfFile = formData.get("pdf") as File | null;
      const userPrompt = formData.get("prompt") as string | null;
      
      // Validate that either PDF or prompt is provided
      if (!pdfFile && !userPrompt) {
        return NextResponse.json(
          { error: "Please provide either a PDF file or text prompt" },
          { status: 400 }
        );
      }
      
      // If PDF is present, extract its content
      if (pdfFile) {
        // File size validation (10MB = 10 * 1024 * 1024 bytes)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (pdfFile.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "File size exceeds 10MB limit" },
            { status: 400 }
          );
        }
        
        // Convert File to ArrayBuffer for processing
        const arrayBuffer = await pdfFile.arrayBuffer();
        
        // Extract PDF content
        try {
          const extractedContent = await extractPDFContent(arrayBuffer);
          pdfText = extractedContent.text;
          pdfMetadata = {
            title: extractedContent.metadata.title,
            pageCount: extractedContent.metadata.pageCount,
          };
        } catch (extractionError) {
          console.error("PDF extraction error:", extractionError);
          const errorMessage = extractionError instanceof Error 
            ? extractionError.message 
            : "Failed to extract PDF content";
          return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
          );
        }
      }
      
      // Build prompt using the prompt builder utility
      prompt = buildPrompt({
        pdfText,
        pdfMetadata,
        userPrompt: userPrompt || undefined,
      });
    } else {
      // Handle JSON request (backward compatibility for text-only mode)
      const body = await request.json();
      const userPrompt = body.prompt;

      if (!userPrompt || typeof userPrompt !== "string") {
        return NextResponse.json(
          { error: "Prompt is required" },
          { status: 400 }
        );
      }
      
      // Build prompt for text-only mode
      prompt = buildPrompt({ userPrompt });
    }

    // GEMINI API AI RESPONSE TIMELINE GENERATION
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = cleanJsonResponse(text);

    let timeline;
    try {
      timeline = JSON.parse(cleanedText);
      console.log('The Timeline:', JSON.stringify(timeline, null, 2));
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Text:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate timeline" },
      { status: 500 }
    );
  }
}
