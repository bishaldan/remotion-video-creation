import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { Timeline } from "../../../../types/edu";
import { KidsTimeline } from "../../../../types/edu-kids";
import { DualQuizTimeline, SingleQuizTimeline } from "../../../../types/quiz";
import { getPrompt } from "../../../lib/prompt/prompt-builder";
import {
  EDUCATION_SYSTEM_PROMPT,
  EDUCATION_KIDS_SYSTEM_PROMPT,
  QUIZ_SYSTEM_PROMPT,
  SINGLE_QUIZ_SYSTEM_PROMPT
} from "../../../lib/prompt/prompts";
import { setNarrationUrls as setKokoroNarrationUrls } from "../../../lib/tts/kokoro-tts";
import { setNarrationUrls as setTypecastNarrationUrls } from "../../../lib/tts/typecastAi-tts";
import { setImagesUrl } from "../../../lib/image/unsplash";
import { cleanJsonResponse } from "../../../lib/utils";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// POST API: GENERATE NEW CONTENT
export async function POST(request: NextRequest) {
  try {
    const { prompt, mode, orientation, voiceType, voiceId } = await getPrompt(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: " API key is not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Select System Prompt
    let systemPrompt = EDUCATION_SYSTEM_PROMPT;
    if (mode === "educationKids") systemPrompt = EDUCATION_KIDS_SYSTEM_PROMPT;
    if (mode === "dualQuiz") systemPrompt = QUIZ_SYSTEM_PROMPT;
    if (mode === "singleQuiz") systemPrompt = SINGLE_QUIZ_SYSTEM_PROMPT;

    const result = await model.generateContent([
      systemPrompt,
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = cleanJsonResponse(text);

    let timeline: Timeline | DualQuizTimeline | SingleQuizTimeline | KidsTimeline;
    try {
      timeline = JSON.parse(cleanedText);


      // Ensure mode/orientation on root object
      if (mode === "educationKids") {
        (timeline as any).mode = "educationKids";
      }
      if (mode === "dualQuiz") {
        (timeline as any).mode = "dualQuiz";
        (timeline as any).orientation = orientation;
      }
      if (mode === "singleQuiz") {
        (timeline as any).mode = "singleQuiz";
      }




      await setImagesUrl(timeline, orientation);
      if (voiceType === "typecast") {
        await setTypecastNarrationUrls(timeline, prompt, mode || "education", voiceId);
      } else {
        await setKokoroNarrationUrls(timeline, prompt, mode || "education", voiceId);
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

// PATCH API: EDIT TIMELINE
export async function PATCH(request: NextRequest) {
  try {
    const { prompt, mode, orientation, voiceType, voiceId } = await getPrompt(request, true); // THE ONLY POINT THAT CHANGES BETWEEN POST AND PATCH IS THE GET PROMPT FUNCTION

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Select System Prompt
    let systemPrompt = EDUCATION_SYSTEM_PROMPT;
    if (mode === "educationKids") systemPrompt = EDUCATION_KIDS_SYSTEM_PROMPT;
    if (mode === "dualQuiz") systemPrompt = QUIZ_SYSTEM_PROMPT;
    if (mode === "singleQuiz") systemPrompt = SINGLE_QUIZ_SYSTEM_PROMPT;

    // Reuse SYSTEM_PROMPT to ensure valid JSON output
    const result = await model.generateContent([
      systemPrompt,
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = cleanJsonResponse(text);

    let newTimeline: Timeline | DualQuizTimeline | SingleQuizTimeline | KidsTimeline;
    try {
      newTimeline = JSON.parse(cleanedText);

      // Ensure specific fields are preserved/set
      if (mode === "educationKids") {
        (newTimeline as any).mode = "educationKids";
      }
      if (mode === "dualQuiz") {
        (newTimeline as any).mode = "dualQuiz";
        (newTimeline as any).orientation = orientation;
      }
      if (mode === "singleQuiz") {
        (newTimeline as any).mode = "singleQuiz";
      }



      await setImagesUrl(newTimeline, orientation);
      if (voiceType === "typecast") {
        await setTypecastNarrationUrls(newTimeline, prompt, mode || "education", voiceId);
      } else {
        await setKokoroNarrationUrls(newTimeline, prompt, mode || "education", voiceId);
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
