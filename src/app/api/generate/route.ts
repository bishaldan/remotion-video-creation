import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

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
1.  **Research Deeply:** The user will give a topic (e.g., "Photosynthesis", "Black Holes"). Provide accurate, real-world educational content.
2.  **Context & Constraints:**
    *   **Resolution:** 1920x1080 pixels.
    *   **FPS:** 30 frames per second.
    *   **Safe Area:** Keep critical elements within 100px padding (x: 100-1820, y: 100-980).
3.  **Structure:** Create 4-8 slides that explain the concept logically:
    *   **Introduction:** Use a "text" or "threeD" slide to introduce the topic.
    *   **Breakdown:** Use "bullets" slides to list key components or steps.
    *   **Visuals:** Use "diagram" slides to show relationships. **CRITICAL:** Position nodes strictly within the safe area (x: 100-1820, y: 100-980) so they don't go off-screen.
    *   **Conclusion:** Summarize with a "text" slide.
4.  **Visuals:**
    *   **Background:** ALWAYS use "#ffffff" (white) for the \`backgroundColor: any\` of EVERY slide.
    *   **Text/Colors:** Since the background is white, ALWAYS use dark, high-contrast colors for text and elements (e.g., "#000000", "#1e293b", "#334155"). Never use light colors for text.
    *   **3D Objects:** We currently support: "cube", "sphere", "pyramid", "torus", "cylinder". Use them **symbolically** for science topics:
        *   **Sphere:** Atoms, planets, cells, particles.
        *   **Cylinder:** DNA helices, pipes, tubes, containers, batteries.
        *   **Torus:** Orbits, magnetic fields, cyclic processes.
        *   **Pyramid:** Hierarchies, energy pyramids, prisms.
        *   **Cube:** Building blocks, storage, stable structures.
5.  **Format:** Return ONLY valid JSON. No markdown formatting around it if possible, but I will clean it.

**Example Topic:** "Water Cycle"
**Example Output Structure (Partial):**
{
  "title": "The Water Cycle",
  "defaultSlideDuration": 5,
  "slides": [
    { "type": "text", "text": "The Water Cycle", "animation": "fadeIn", "durationInSeconds": 4 },
    { "type": "bullets", "title": "Stages", "bullets": ["Evaporation", "Condensation"], "durationInSeconds": 6 },
    ...
  ]
}
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

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
      `Create an educational video timeline for the topic: "${prompt}"`,
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
