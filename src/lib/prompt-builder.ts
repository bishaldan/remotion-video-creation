/**
 * Prompt Builder Utility
 * 
 * Constructs appropriate prompts for the AI model based on input type:
 * - PDF-only mode: Uses extracted PDF text
 * - Text-only mode: Uses user's text prompt (existing behavior)
 * - Combined mode: Prioritizes PDF content with supplementary text prompt
 */

import { NextRequest, NextResponse } from "next/server";
import { extractPDFContent } from "./pdf-extractor";

export interface PromptBuilderInput {
  pdfText?: string;
  pdfMetadata?: {
    title?: string;
    pageCount: number;
  };
  userPrompt?: string;
}

/**
 * Builds an appropriate prompt for the AI model based on the provided input.
 * 
 * @param input - The input containing PDF text, metadata, and/or user prompt
 * @returns A formatted prompt string for the AI model
 * 
 * Requirements:
 * - 3.1: Receive extracted PDF text in prompt when PDF is provided
 * - 3.2: Generate content based on user's text prompt when no PDF
 * - 3.3: Prepend instructions when PDF content is provided
 * - 3.4: Append extracted text after instruction
 * - 3.5: Prioritize PDF content when both PDF and text prompt are provided
 */
export function buildPrompt(input: PromptBuilderInput): string {
  // PDF-only mode or Combined mode (PDF + supplementary prompt)
  if (input.pdfText) {
    const title = input.pdfMetadata?.title || "Untitled";
    const pageCount = input.pdfMetadata?.pageCount || 0;
    
    let prompt = `You are generating an educational video timeline based on the following PDF document.

PDF Title: ${title}
Pages: ${pageCount}

PDF Content:
${input.pdfText}`;

    // Combined mode: Add supplementary context if user prompt is provided
    if (input.userPrompt) {
      prompt += `

Additional Context: ${input.userPrompt}`;
    }

    prompt += `

Create an educational video timeline that covers the key concepts from this document.`;

    return prompt;
  }
  
  // Text-only mode (existing behavior)
  if (input.userPrompt) {
    return `Create an educational video timeline for the topic: "${input.userPrompt}"`;
  }
  
  // No input provided - should not happen in normal flow
  throw new Error("Either pdfText or userPrompt must be provided");
}

export const getPrompt= async (request: NextRequest): Promise<string> => {

    const contentType = request.headers.get("content-type") || "";
    
    let prompt: string; 
    let pdfText: string | undefined;
    let pdfMetadata: { title?: string; pageCount: number } | undefined;

    if(contentType.includes("multipart/form-data")){
      const formData = await request.formData();
      const pdfFile = formData.get("pdf") as File | null;
      const userPrompt = formData.get("prompt") as string | null;
      
      // Validate that either PDF or prompt is provided
      if (!pdfFile && !userPrompt) {
        throw NextResponse.json(
          { error: "Please provide either a PDF file or text prompt" },
          { status: 400 }
        );
      }
      
      // If PDF is present, extract its content
      if (pdfFile) {
        // File size validation (10MB = 10 * 1024 * 1024 bytes)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (pdfFile.size > MAX_FILE_SIZE) {
          throw NextResponse.json(
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
          throw NextResponse.json(
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
        throw NextResponse.json(
          { error: "Prompt is required" },
          { status: 400 }
        );
      }
      
      // Build prompt for text-only mode
      prompt = buildPrompt({ userPrompt });
    }
      return prompt
}
