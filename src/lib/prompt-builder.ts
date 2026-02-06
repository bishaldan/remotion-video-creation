/**
 * Prompt Builder Utility
 * 
 * Constructs appropriate prompts for the AI model based on input type:
 * - PDF-only mode: Uses extracted PDF text
 * - Text-only mode: Uses user's text prompt (existing behavior)
 * - Combined mode: Prioritizes PDF content with supplementary text prompt
 */

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
