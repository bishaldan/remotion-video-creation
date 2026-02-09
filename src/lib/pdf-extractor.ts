import { extractText, getMeta } from 'unpdf';

/**
 * Extracted PDF content structure
 */
export interface ExtractedPDFContent {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    pageCount: number;
    creationDate?: Date;
  };
}

/**
 * Extracts text content and metadata from a PDF file buffer
 * 
 * @param fileBuffer - ArrayBuffer containing the PDF file data
 * @returns Promise resolving to extracted text and metadata
 * @throws Error if PDF extraction fails
 * 
 * Requirements: 2.1, 2.2, 2.6
 */
export async function extractPDFContent(
  fileBuffer: ArrayBuffer
): Promise<ExtractedPDFContent> {
  try {
    // Extract all text content with pages merged
    const extractedData = await extractText(fileBuffer.slice(0), { mergePages: true });
    
    // Extract metadata from the PDF
    const metadata = await getMeta(fileBuffer.slice(0));
    
    return {
      text: extractedData.text,
      metadata: {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        pageCount: extractedData.totalPages,
        creationDate: metadata.info?.CreationDate 
          ? new Date(metadata.info.CreationDate) 
          : undefined,
      },
    };
  } catch (error) {
    // Provide descriptive error messages for different failure scenarios
    // console.log(error)
    if (error instanceof Error) {
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error('Failed to extract PDF content: The PDF is password-protected or encrypted');
      }
      throw new Error(`Failed to extract PDF content: ${error.message}`);
    }
    throw new Error('Failed to extract PDF content: Unknown error occurred');
  }
}
