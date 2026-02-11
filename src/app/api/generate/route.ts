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
        } else if (slide.type === "singleQuiz" && slide.imageQuery) {
          imageQueries.push(slide.imageQuery);
          imageSlides.push(index);
        }
      });

      // Batch fetch from Unsplash
      if (imageQueries.length > 0) {
        console.log("Fetching Unsplash images for:", imageQueries);
        
        const imagesMap = new Map();
        await Promise.all(imageQueries.map(async (query, i) => {
             await new Promise(r => setTimeout(r, i * 50));
             const searchOrientation = orientation === "portrait" ? "portrait" : "landscape";
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
             if (slide.type === "image") slide.imageUrl = image.url;
             else if (slide.type === "quiz") slide.backgroundUrl = image.url;
             else if (slide.type === "singleQuiz") slide.imageUrl = image.url;
          } else {
              const fallbackUrl = `https://source.unsplash.com/${orientation === 'portrait' ? '1080x1920' : '1920x1080'}/?${encodeURIComponent(query)}`;
              if (slide.type === "image") slide.imageUrl = fallbackUrl;
              else if (slide.type === "quiz") slide.backgroundUrl = fallbackUrl;
              else if (slide.type === "singleQuiz") slide.imageUrl = fallbackUrl;
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
        } else if (slide.type === "singleQuiz" && slide.imageQuery) {
          imageQueries.push(slide.imageQuery);
          imageSlides.push(index);
        }
      });

      if (imageQueries.length > 0) {
        console.log("Fetching Unsplash images for edits:", imageQueries);
        
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
             if (slide.type === "image") slide.imageUrl = image.url;
             else if (slide.type === "quiz") slide.backgroundUrl = image.url;
             else if (slide.type === "singleQuiz") slide.imageUrl = image.url;
          } else {
             const fallbackUrl = `https://source.unsplash.com/${orientation === 'portrait' ? '1080x1920' : '1920x1080'}/?${encodeURIComponent(query)}`;
              if (slide.type === "image") slide.imageUrl = fallbackUrl;
              else if (slide.type === "quiz") slide.backgroundUrl = fallbackUrl;
              else if (slide.type === "singleQuiz") slide.imageUrl = fallbackUrl;
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

