import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { Timeline } from "../../../../types/constants";
import { extractPDFContent } from "../../../lib/pdf-extractor";
import { buildPrompt } from "../../../lib/prompt-builder";
import { batchSearchUnsplash } from "../../../lib/unsplash";

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
You are an expert educational video content generator. Your goal is to create engaging, accurate, and visually rich educational video timelines.

You will output a JSON object that matches the following TypeScript interface (do not include the interface definition, just the JSON):

\`\`\`typescript
type Slide =
  | {
      type: "text";
      text: string;
      animation: "typewriter" | "fadeIn" | "wordByWord";
      fontSize?: number;
      textColor?: string;
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "bullets";
      title?: string;
      bullets: string[];
      bulletIcon?: string;
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
      shape: "cube" | "sphere" | "pyramid" | "torus" | "cylinder";
      objects?: { shape: string; color: string; position: [number, number, number]; scale: number; label?: string; animation?: string; rotation?: [number, number, number] }[];
      cameraPosition?: [number, number, number];
      color?: string;
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "image";
      imageUrl: string; // Leave empty, will be filled based on imageQuery
      imageQuery: string; // Specific keyword for Unsplash search (e.g., "DNA helix black background")
      caption?: string;
      kenBurns: "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "none";
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "lottie";
      animationType: "explaining" | "thinking" | "pointing" | "celebrating" | "writing" | "presenting";
      text: string;
      title?: string;
      position: "left" | "right";
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "intro";
      title: string;
      subtitle?: string;
      author?: string;
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "outro";
      title?: string;
      callToAction?: string;
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
1.  **Research Deeply & Factual Truth:** Cross-reference facts. Ensure 3D accuracy.
2.  **Context & Constraints (HIGH PRIORITY):**
    *   **Resolution:** 1920x1080 pixels. **FPS:** 30.
    *   **Safe Area:** Keep critical elements within 100px padding.
    *   **ALL VISUALS MUST FIT within 1920x1080** - objects too large will be clipped, too small won't be visible.
3.  **Slide Variety (CRITICAL):**
    *   **Introduction:** ALWAYS start with an **Intro** slide.
    *   **Core Concepts:** Use **Image** (visuals), **ThreeD** (spatial), **Diagram** (relationships), or **Lottie** (explaining) slides.
    *   **Details:** Use **Bullets** slides with emoji icons (e.g., 💡, 🔬, 🌍).
    *   **Conclusion:** ALWAYS end with an **Outro** slide.
    *   **Mix it up!** Avoid sequential slides of the same type.
4.  **Visuals:**
    *   **Backgrounds:** Use dark, modern gradients. **DO NOT** use white (#ffffff) or plain black (#000000).
        *   Examples: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)", "linear-gradient(135deg, #2d1b4e 0%, #0f0f1a 100%)".
    *   **Images (MANDATORY - STRICT 3-WORD LIMIT):**
        *   \`imageQuery\` MUST be EXACTLY 1-3 simple words. NO MORE.
        *   ✅ Good: "solar system", "dna", "mountain", "ocean wave", "brain anatomy"
        *   ❌ Bad: "abstract visualization of quantum mechanics", "beautiful sunset over mountain range"
        *   If you use more than 3 words, images WILL NOT be found.
    *   **Lottie:** Use "explaining" for intros, "thinking" for questions, "pointing" for emphasis, "celebrating" for endings.
5.  **3D Slides (HIGH PRIORITY - 1800x900 AWARE):**
    *   **Canvas is 1920x1080 pixels** - design objects to fill ~60-80% of screen.
    *   Keep object count LOW (1-3 objects max for visibility).
    *   Positions: x,y,z values between -2 and 2 (closer to center = more visible).
    *   Scale values: 1.0-1.5 for single objects, 0.7-1.0 for 2-3 objects.
    *   **DO NOT** use scale < 0.5 (too small) or > 2.0 (clips out of frame).
    *   Use "float" or "none" animations only.
6.  **Diagram Slides (CRITICAL):**
    *   Keep node count LOW (3-5 nodes max).
    *   Space nodes evenly within safe area: x values 250-1650, y values 150-550.
    *   Use descriptive short labels (2-4 words max).
    *   Use colors from the palette: #6366f1, #8b5cf6, #ec4899, #10b981.
7.  **Format:** Return ONLY valid JSON.
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
        { error: " API key is not configured" },
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

    let timeline: Timeline;
    try {
      timeline = JSON.parse(cleanedText);
      // console.log('The Timeline (Raw):', JSON.stringify(timeline, null, 2));

      // Post-process: Resolve Unsplash images
      const imageQueries: string[] = [];
      const imageSlides: number[] = [];

      // Identify image slides and collect queries
      timeline.slides.forEach((slide, index) => {
        if (slide.type === "image" && slide.imageQuery) {
          imageQueries.push(slide.imageQuery);
          imageSlides.push(index);
        }
      });

      // Batch fetch from Unsplash if we have images
      if (imageQueries.length > 0) {
        console.log("Fetching Unsplash images for:", imageQueries);
        const imagesMap = await batchSearchUnsplash(imageQueries);

        // Update slides with resolved URLs
        for (let i = 0; i < imageSlides.length; i++) {
          const slideIndex = imageSlides[i];
          const query = imageQueries[i];
          const image = imagesMap.get(query);
          const slide = timeline.slides[slideIndex];
          
          if (slide.type === "image" && image) {
            slide.imageUrl = image.url;
          //   // Optionally update caption if not provided or add credit
          //   if (!slide.creditText) {
          //       // @ts-ignore - Adding property that might not exist in strict type if not defined in prompt interface, but exists in our schema
          //       slide.creditText = `Photo by ${image.photographer} / Unsplash`;
          //   }
          } else if (slide.type === "image") {
              // Fallback if no image found (though fallback logic is in unsplash.ts too)
              slide.imageUrl = `https://source.unsplash.com/1920x1080/?${encodeURIComponent(query)}`;
          }
        }
      }

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
