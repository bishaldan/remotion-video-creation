import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { QuizTimeline, Timeline } from "../../../../types/constants";
import { getPrompt } from "../../../lib/prompt-builder";

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

const NORMAL_SYSTEM_PROMPT = `
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
        *   Unsplash is used to find the images, so use keywords that are likely to be found on Unsplash. Nothing too specific or complex
        *   If you use more than 3 words, images WILL NOT be found.
    *   **Lottie:** Use "explaining" for intros, "thinking" for questions, "pointing" for emphasis, "celebrating" for endings.
5.  **Diagram Slides (CRITICAL):**
    *   Keep node count LOW (3-5 nodes max).
    *   Space nodes evenly within safe area: x values 250-1650, y values 150-550.
    *   Use descriptive short labels (2-4 words max).
    *   Use colors from the palette: #6366f1, #8b5cf6, #ec4899, #10b981.
6.  **Format:** Return ONLY valid JSON.
`;

const QUIZ_SYSTEM_PROMPT = `
You are an expert viral quiz generator. Your goal is to create engaging, fast-paced quiz videos similar to viral TikTok/Shorts content.

You will output a JSON object that matches the following TypeScript interface (do not include the interface definition, just the JSON):

\`\`\`typescript
type Slide =
  | {
      type: "intro";
      title: string;
      subtitle?: string;
      author?: string;
      backgroundColor?: string;
      durationInSeconds: number;
    }
  | {
      type: "quiz";
      question: string;
      options: string[]; // Array of 2-4 options
      correctIndex: number; // 0-based index of the correct option
      backgroundQuery: string; // 1-3 KEYWORDS for Unsplash image (e.g. "mars planet", "lion face")
      durationInSeconds: number;
    }
  | {
      type: "outro";
      title?: string;
      callToAction?: string;
      backgroundColor?: string;
      durationInSeconds: number;
    };

interface QuizTimeline {
  title: string;
  mode: "quiz";
  slides: Slide[];
  defaultSlideDuration: number;
}
\`\`\`

**Instructions:**
1. **Topic:** Create a quiz based on the user's prompt.
2. **Structure:**
   - Start with an **Intro** slide.
   - Follow with **5-8 Quiz** slides.
   - End with an **Outro** slide.
3. **Quiz Content:**
   - Questions should be interesting and testing knowledge.
   - 4 options per question.
   - **backgroundQuery:** MUST be 1-3 simple words describing the subject (e.g., "Eiffel Tower", "Elephant", "Pizza"). definitive visuals.
   - **durationInSeconds:** Set to 7 for quiz slides.
4. **Visuals:**
   - Quiz slides use fullscreen images. Ensure the backgroundQuery is highly visual.
5. **Format:** Return ONLY valid JSON.
`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, mode, orientation } = await getPrompt(request);
      
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

    const systemPrompt = mode === "quiz" ? QUIZ_SYSTEM_PROMPT : NORMAL_SYSTEM_PROMPT;

    const result = await model.generateContent([
      systemPrompt,
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = cleanJsonResponse(text);

    let timeline: Timeline | QuizTimeline;
    try {
      timeline = JSON.parse(cleanedText);
      console.log('POST TIMELINE:', JSON.stringify(timeline, null, 2));
      // Ensure mode and orientation are set correctly on the timeline object
      if (mode === "quiz") {
          (timeline as any).mode = "quiz";
          (timeline as any).orientation = orientation;
      }
      
      console.log('Generated Timeline:', JSON.stringify(timeline, null, 2));

      // Post-process: Resolve Unsplash images
      const imageQueries: string[] = [];
      const imageSlides: number[] = [];

      // Identify image slides and collect queries
      timeline.slides.forEach((slide: any, index: number) => {
        if (slide.type === "image" && slide.imageQuery) {
          imageQueries.push(slide.imageQuery);
          imageSlides.push(index);
        } else if (slide.type === "quiz" && slide.backgroundQuery) {
          imageQueries.push(slide.backgroundQuery);
          imageSlides.push(index);
        }
      });

      // Batch fetch from Unsplash if we have images
      if (imageQueries.length > 0) {
        console.log("Fetching Unsplash images for:", imageQueries);
        // Pass orientation to searchUnsplash (batchSearchUnsplash needs update or we map manually)
        // Since batchSearchUnsplash implementation in unsplash.ts uses searchUnsplash defaults (landscape), 
        // we should ideally update batchSearchUnsplash to accept orientation or loop here.
        // Let's loop here for finer control or update unsplash.ts. 
        // For now, let's just use the batch function but we need to update unsplash.ts to support orientation in batch
        // OR we just map over them here. 
        
        // Actually, let's map manually here to support orientation per request
        const imagesMap = new Map();
        await Promise.all(imageQueries.map(async (query, i) => {
             // Add small delay to avoid rate limiting
             await new Promise(r => setTimeout(r, i * 50));
             
             // Use the requested orientation for search
             const searchOrientation = orientation === "portrait" ? "portrait" : "landscape";
             
             // We need to import searchUnsplash directly or use the batch one if we update it.
             // Let's re-import searchUnsplash and use it directly.
             const { searchUnsplash } = require("../../../lib/unsplash");
             const image = await searchUnsplash(query, searchOrientation);
             imagesMap.set(query, image);
        }));


        // Update slides with resolved URLs
        for (let i = 0; i < imageSlides.length; i++) {
          const slideIndex = imageSlides[i];
          const query = imageQueries[i];
          const image = imagesMap.get(query);
          const slide = timeline.slides[slideIndex] as any;
          
          if (image) {
             if (slide.type === "image") {
                slide.imageUrl = image.url;
             } else if (slide.type === "quiz") {
                slide.backgroundUrl = image.url;
             }
          } else {
              // Fallback
              const fallbackUrl = `https://source.unsplash.com/${orientation === 'portrait' ? '1080x1920' : '1920x1080'}/?${encodeURIComponent(query)}`;
              if (slide.type === "image") {
                  slide.imageUrl = fallbackUrl;
              } else if (slide.type === "quiz") {
                  slide.backgroundUrl = fallbackUrl;
              }
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

export async function PATCH(request: NextRequest) {
  try {
    const { prompt, mode, orientation } = await getPrompt(request, true);

    // GEMINI API
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = mode === "quiz" ? QUIZ_SYSTEM_PROMPT : NORMAL_SYSTEM_PROMPT;

    // Reuse SYSTEM_PROMPT to ensure valid JSON output
    const result = await model.generateContent([
      systemPrompt, 
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = cleanJsonResponse(text);

    let newTimeline: Timeline | QuizTimeline;
    try {
      newTimeline = JSON.parse(cleanedText);
      
      // Ensure specific fields are preserved/set
      if (mode === "quiz") {
         (newTimeline as any).mode = "quiz";
         (newTimeline as any).orientation = orientation;
      }
      
      console.log('Edited Timeline:', JSON.stringify(newTimeline, null, 2));

      // Post-process: Resolve Unsplash images
      const imageQueries: string[] = [];
      const imageSlides: number[] = [];

      newTimeline.slides.forEach((slide: any, index: number) => {
        if (slide.type === "image" && slide.imageQuery) {
          imageQueries.push(slide.imageQuery);
          imageSlides.push(index);
        } else if (slide.type === "quiz" && slide.backgroundQuery) {
          imageQueries.push(slide.backgroundQuery);
          imageSlides.push(index);
        }
      });

      if (imageQueries.length > 0) {
        console.log("Fetching Unsplash images for edits:", imageQueries);
        
        // Manual batch fetch (same as POST)
        const imagesMap = new Map();
        await Promise.all(imageQueries.map(async (query, i) => {
             await new Promise(r => setTimeout(r, i * 50));
             const searchOrientation = orientation === "portrait" ? "portrait" : "landscape";
             const { searchUnsplash } = require("../../../lib/unsplash");
             const image = await searchUnsplash(query, searchOrientation);
             imagesMap.set(query, image);
        }));

        for (let i = 0; i < imageSlides.length; i++) {
          const slideIndex = imageSlides[i];
          const query = imageQueries[i];
          const image = imagesMap.get(query);
          const slide = newTimeline.slides[slideIndex] as any;
          
          if (image) {
             if (slide.type === "image") {
                slide.imageUrl = image.url;
             } else if (slide.type === "quiz") {
                slide.backgroundUrl = image.url;
             }
          } else {
             const fallbackUrl = `https://source.unsplash.com/${orientation === 'portrait' ? '1080x1920' : '1920x1080'}/?${encodeURIComponent(query)}`;
              if (slide.type === "image") {
                  slide.imageUrl = fallbackUrl;
              } else if (slide.type === "quiz") {
                  slide.backgroundUrl = fallbackUrl;
              }
          }
        }
      }

      return NextResponse.json({ timeline: newTimeline });

    } catch (parseError) {
      console.error("JSON Parse Error in Edit:", parseError, "Text:", text);
      return NextResponse.json(
        { error: "Failed to parse edited timeline" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Edit API error:", error);
    return NextResponse.json(
      { error: "Failed to edit timeline" },
      { status: 500 }
    );
  }
}
