/**
 * Prompt Builder Utility
 * 
 * Constructs appropriate prompts for the AI model based on input type:
 * - PDF-only mode: Uses extracted PDF text
 * - Text-only mode: Uses user's text prompt (existing behavior)
 * - Combined mode: Prioritizes PDF content with supplementary text prompt
 * - Edit mode: Modifies existing timeline based on user instructions (with optional PDF context)
 */

import { NextRequest } from "next/server";
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


/**
 * Builds a prompt for editing an existing timeline.
 */
export function buildEditPrompt(timeline: any, editInstruction: string): string {
  return `You are an expert video editor. You are given a specific "Current Timeline" JSON and a "User Edit Request".

**GOAL:**
Modify the "Current Timeline" to satisfy the "User Edit Request".

**RULES:**
1.  **Output ONLY valid JSON.** No markdown, no explanations.
2.  **Minimal Changes:** Only change what is requested. Keep the rest of the structure intact.
3.  **Validity:** Ensure the output is still valid according to the original schema (e.g., correct slide types, fields).

**Current Timeline:**
${JSON.stringify(timeline, null, 2)}

**User Edit Request:**
"${editInstruction}"

**Output:**
Return the modified JSON object.`;
}

export const getPrompt = async (request: NextRequest, isEdit: boolean = false): Promise<string> => {

    const contentType = request.headers.get("content-type") || "";
    
    let prompt: string; 
    let pdfText: string | undefined;
    let pdfMetadata: { title?: string; pageCount: number } | undefined;

    if(contentType.includes("multipart/form-data")){
      const formData = await request.formData();
      const pdfFile = formData.get("pdf") as File | null;
      const userPrompt = formData.get("prompt") as string | null;
      
      // Validate that either PDF or prompt is provided (or just timeline for edit?)
      if (!pdfFile && !userPrompt) {
        throw new Error("Please provide either a PDF file or text prompt");
      }
      
      // If PDF is present, extract its content
      if (pdfFile) {
        // File size validation (10MB = 10 * 1024 * 1024 bytes)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (pdfFile.size > MAX_FILE_SIZE) {
          throw new Error("File size exceeds 10MB limit");
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
          throw new Error(extractionError instanceof Error ? extractionError.message : "Failed to extract PDF content");
        }
      }

      if (isEdit) {
        const timelineJson = formData.get("timeline") as string | null;
        if (!timelineJson) {
           throw new Error("Timeline is required for editing");
        }
        let timeline;
        try {
            timeline = JSON.parse(timelineJson);
        } catch (e) {
            throw new Error("Invalid timeline JSON");
        }

        let fullInstruction = userPrompt || "Edit the video based on the provided document.";
        if (pdfText) {
            fullInstruction += `\n\nReference Document Context:\n${pdfText}`;
        }
        return buildEditPrompt(timeline, fullInstruction);
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
      
      if (isEdit) {
         const { timeline, editPrompt } = body;
         if (!timeline || !editPrompt) {
            throw new Error("Timeline and editPrompt are required");
         }
         return buildEditPrompt(timeline, editPrompt);
      }

      const userPrompt = body.prompt;
      if (!userPrompt || typeof userPrompt !== "string") {
        throw new Error("Prompt is required");
      }
      
      // Build prompt for text-only mode
      prompt = buildPrompt({ userPrompt });
    }
      return prompt
}
