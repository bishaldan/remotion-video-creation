import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { Timeline } from "../../../../types/edu";
import { QuizTimeline, SingleQuizTimeline } from "../../../../types/quiz";
import { getPrompt } from "../../../lib/prompt-builder";
import {
  EDUCATION_SYSTEM_PROMPT,
  QUIZ_SYSTEM_PROMPT,
  SINGLE_QUIZ_SYSTEM_PROMPT
} from "../../../lib/prompts";
import { setNarrationUrls } from "../../../lib/tts";
import { setImagesUrl } from "../../../lib/unsplash";
import { cleanJsonResponse } from "../../../lib/utils";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// POST API: GENERATE NEW CONTENT
export async function POST(request: NextRequest) {
  try {
    const { prompt, mode, orientation } = await getPrompt(request);
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
    if (mode === "quiz") systemPrompt = QUIZ_SYSTEM_PROMPT;
    if (mode === "singleQuiz") systemPrompt = SINGLE_QUIZ_SYSTEM_PROMPT;

    const result = await model.generateContent([
      systemPrompt,
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = cleanJsonResponse(text);

    let timeline: Timeline | QuizTimeline | SingleQuizTimeline;
    try {
      timeline = JSON.parse(cleanedText);
      console.log('POST TIMELINE:', JSON.stringify(timeline, null, 2));
      
      // Ensure mode/orientation on root object
      if (mode === "quiz") {
          (timeline as any).mode = "quiz";
          (timeline as any).orientation = orientation;
      }
      if (mode === "singleQuiz") {
          (timeline as any).mode = "singleQuiz";
          // Single quiz is always landscape effectively, but we can store it if needed
      }
      
      console.log('Generated Timeline:', JSON.stringify(timeline, null, 2));

      
      await setImagesUrl(timeline, orientation);
      await setNarrationUrls(timeline);

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
    const { prompt, mode, orientation } = await getPrompt(request, true); // THE ONLY POINT THAT CHANGES BETWEEN POST AND PATCH IS THE GET PROMPT FUNCTION

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
    if (mode === "quiz") systemPrompt = QUIZ_SYSTEM_PROMPT;
    if (mode === "singleQuiz") systemPrompt = SINGLE_QUIZ_SYSTEM_PROMPT;

    // Reuse SYSTEM_PROMPT to ensure valid JSON output
    const result = await model.generateContent([
      systemPrompt, 
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = cleanJsonResponse(text);

    let newTimeline: Timeline | QuizTimeline | SingleQuizTimeline;
    try {
      newTimeline = JSON.parse(cleanedText);
      
      // Ensure specific fields are preserved/set
      if (mode === "quiz") {
         (newTimeline as any).mode = "quiz";
         (newTimeline as any).orientation = orientation;
      }
      if (mode === "singleQuiz") {
         (newTimeline as any).mode = "singleQuiz";
      }
      
      console.log('Edited Timeline:', JSON.stringify(newTimeline, null, 2));

      await setImagesUrl(newTimeline, orientation);
      await setNarrationUrls(newTimeline);

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

