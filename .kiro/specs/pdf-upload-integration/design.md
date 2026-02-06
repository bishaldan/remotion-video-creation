# Design Document: PDF Upload Integration

## Overview

This design adds PDF upload functionality to the educational video generator. Users can upload PDF documents, which will be processed to extract text content and fed to the Gemini AI model to generate educational video timelines. The feature maintains backward compatibility with the existing text-prompt workflow.

The implementation uses the `unpdf` library ([npm package](https://www.npmjs.com/package/unpdf)), a modern serverless-optimized PDF extraction tool built on Mozilla's PDF.js. This library is specifically designed for serverless environments and AI document processing workflows, making it ideal for Next.js API routes.

## Architecture

### High-Level Flow

```mermaid
graph TD
    A[User Interface] -->|Upload PDF or Enter Prompt| B[Frontend State Management]
    B -->|FormData with PDF| C[/api/generate Route]
    B -->|JSON with prompt| C
    C -->|PDF File| D[PDF Extractor unpdf]
    D -->|Extracted Text| E[Prompt Builder]
    C -->|Text Prompt| E
    E -->|Enhanced Prompt| F[Gemini AI]
    F -->|Timeline JSON| G[Response Handler]
    G -->|Timeline| A
    A -->|Timeline| H[Remotion Player]
```

### Component Interaction

1. **Frontend (page.tsx)**: Handles file selection, validation, and submission
2. **API Route (/api/generate)**: Orchestrates PDF extraction and AI generation
3. **PDF Extractor (unpdf)**: Extracts text from uploaded PDFs
4. **Gemini AI**: Generates video timelines from content
5. **Remotion Player**: Renders the generated video timeline

## Components and Interfaces

### 1. PDF Upload Component (Frontend)

**Location**: `src/app/page.tsx`

**New State Variables**:
```typescript
const [pdfFile, setPdfFile] = useState<File | null>(null);
const [uploadMode, setUploadMode] = useState<"prompt" | "pdf">("prompt");
```

**UI Elements**:
- File input with drag-and-drop support
- File validation (type, size)
- Visual feedback showing selected file
- Clear/remove button for selected file
- Mode toggle between prompt and PDF upload

**File Validation Rules**:
- Accept only `.pdf` files (MIME type: `application/pdf`)
- Maximum file size: 10MB
- Display error messages for invalid files

### 2. API Route Enhancement

**Location**: `src/app/api/generate/route.ts`

**Request Handling**:
```typescript
// Accept both JSON and FormData
// Check for PDF file in FormData
// Extract PDF content if present
// Build appropriate prompt for Gemini
```

**Response Format** (unchanged):
```typescript
{
  timeline: Timeline // Zod-validated timeline object
}
```

**Error Responses**:
```typescript
{
  error: string // Descriptive error message
}
```

### 3. PDF Extraction Service

**Library**: `unpdf` (v0.x)

**Key Methods**:
- `extractText(pdfBuffer, { mergePages: true })`: Extract all text as single string
- `extractMetadata(pdfBuffer)`: Get PDF metadata (title, author, page count)

**Implementation**:
```typescript
import { extractText, extractMetadata } from 'unpdf';

async function extractPDFContent(fileBuffer: ArrayBuffer): Promise<{
  text: string;
  metadata: {
    title?: string;
    pageCount: number;
  };
}> {
  const text = await extractText(fileBuffer, { mergePages: true });
  const metadata = await extractMetadata(fileBuffer);
  
  return {
    text,
    metadata: {
      title: metadata.info?.Title,
      pageCount: metadata.numPages
    }
  };
}
```

### 4. Prompt Builder

**Purpose**: Construct appropriate prompts for Gemini based on input type

**Logic**:
```typescript
function buildPrompt(input: {
  pdfText?: string;
  pdfMetadata?: { title?: string; pageCount: number };
  userPrompt?: string;
}): string {
  if (input.pdfText) {
    return `
You are generating an educational video timeline based on the following PDF document.

PDF Title: ${input.pdfMetadata?.title || "Untitled"}
Pages: ${input.pdfMetadata?.pageCount}

PDF Content:
${input.pdfText}

${input.userPrompt ? `Additional Context: ${input.userPrompt}` : ''}

Create an educational video timeline that covers the key concepts from this document.
`;
  } else {
    return `Create an educational video timeline for the topic: "${input.userPrompt}"`;
  }
}
```

## Data Models

### PDF Upload State

```typescript
interface PDFUploadState {
  file: File | null;
  fileName: string;
  fileSize: number;
  isValid: boolean;
  error: string | null;
}
```

### API Request (with PDF)

```typescript
// FormData structure
{
  pdf: File,           // The PDF file
  prompt?: string      // Optional supplementary prompt
}
```

### API Request (without PDF)

```typescript
// JSON structure (existing)
{
  prompt: string
}
```

### Extracted PDF Content

```typescript
interface ExtractedPDFContent {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    pageCount: number;
    creationDate?: Date;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Type Validation

*For any* file object, the PDF uploader should accept it if and only if its MIME type is "application/pdf", and should display an error message for all other file types.

**Validates: Requirements 1.2, 1.3**

### Property 2: File Display Information

*For any* valid PDF file that is selected, the UI should display both the filename and file size in the rendered output.

**Validates: Requirements 1.4**

### Property 3: File Removal Resets State

*For any* PDF file that has been selected, clicking the clear/remove button should reset the file state to null.

**Validates: Requirements 1.5**

### Property 4: PDF Upload Disables Prompt Input

*For any* valid PDF file, when it is selected, the text prompt input field should be disabled.

**Validates: Requirements 1.6**

### Property 5: PDF Text Extraction Returns String

*For any* valid PDF file with text content, the extraction process should return a non-empty string containing the extracted text.

**Validates: Requirements 2.1, 2.6**

### Property 6: Text Structure Preservation

*For any* PDF with structured content (paragraphs, headings), the extracted text should preserve the logical structure with appropriate spacing and line breaks.

**Validates: Requirements 2.2**

### Property 7: Image Metadata Detection

*For any* PDF containing images or diagrams, the extraction metadata should indicate the presence of images.

**Validates: Requirements 2.3**

### Property 8: Extraction Error Handling

*For any* PDF extraction failure (corrupted file, unsupported format, etc.), the API should return a descriptive error message to the user.

**Validates: Requirements 2.5**

### Property 9: PDF Content in AI Prompt

*For any* PDF with extracted text, the prompt sent to the Timeline_Generator should contain the instruction "Generate a video timeline based on the following PDF content" followed by the extracted text.

**Validates: Requirements 3.1, 3.3, 3.4**

### Property 10: PDF Priority Over Text Prompt

*For any* request containing both PDF content and a text prompt, the generated prompt should prioritize the PDF content as the primary source and include the text prompt as supplementary context.

**Validates: Requirements 3.5**

### Property 11: API PDF Detection and Processing

*For any* request to the Generation_API, if a PDF file is present in the FormData, the API should extract its content before calling the AI model.

**Validates: Requirements 4.2, 4.3**

### Property 12: File Size Validation

*For any* file with size exceeding 10MB, the API should reject the upload and return an error message indicating the file is too large.

**Validates: Requirements 4.5**

### Property 13: Loading State Progression

*For any* PDF upload and generation request, the loading indicator should progress through distinct states: "Extracting PDF content..." during extraction, then "Generating video timeline..." during AI generation.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 14: Error Message Display

*For any* error occurring during PDF processing (extraction, validation, or generation), the system should display a clear error message containing the reason for the failure.

**Validates: Requirements 5.5**

### Property 15: Mode Switching Clears State

*For any* user action that switches between PDF upload mode and text prompt mode, the system should clear the previous input (either the selected file or the text prompt).

**Validates: Requirements 6.4**



## Error Handling

### Frontend Error Scenarios

1. **Invalid File Type**
   - **Trigger**: User selects non-PDF file
   - **Response**: Display error message "Please select a valid PDF file"
   - **Recovery**: Allow user to select a different file

2. **File Too Large**
   - **Trigger**: User selects PDF > 10MB
   - **Response**: Display error message "File size exceeds 10MB limit"
   - **Recovery**: Prompt user to select a smaller file

3. **File Read Error**
   - **Trigger**: Browser fails to read selected file
   - **Response**: Display error message "Failed to read file. Please try again."
   - **Recovery**: Allow user to reselect file

### Backend Error Scenarios

1. **PDF Extraction Failure**
   - **Trigger**: `unpdf` fails to extract text (corrupted PDF, encrypted PDF)
   - **Response**: Return 400 error with message "Failed to extract PDF content: [reason]"
   - **Logging**: Log full error details for debugging

2. **Missing API Key**
   - **Trigger**: Gemini API key not configured
   - **Response**: Return 500 error with message "AI service not configured"
   - **Logging**: Log configuration error

3. **AI Generation Failure**
   - **Trigger**: Gemini API returns error or invalid response
   - **Response**: Return 500 error with message "Failed to generate timeline"
   - **Logging**: Log API response for debugging

4. **Invalid Request Format**
   - **Trigger**: Request missing both PDF and prompt
   - **Response**: Return 400 error with message "Please provide either a PDF file or text prompt"

### Error Message Guidelines

- **User-Facing**: Clear, actionable messages without technical jargon
- **Logging**: Detailed technical information for debugging
- **Status Codes**: 
  - 400 for client errors (invalid input, validation failures)
  - 500 for server errors (API failures, extraction errors)

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples, edge cases, and error conditions:

**Frontend Tests** (`src/app/page.test.tsx`):
- File input renders correctly on page load
- Valid PDF file selection updates state
- Invalid file type shows error message
- File size validation (exactly 10MB, 10MB + 1 byte)
- Clear button resets file state
- Mode switching clears appropriate inputs
- Loading states display correct messages

**API Route Tests** (`src/app/api/generate/route.test.ts`):
- Request with text prompt only (backward compatibility)
- Request with PDF only
- Request with both PDF and text prompt
- Request with neither PDF nor prompt (error case)
- File size validation at API level
- Error responses have correct status codes and messages

**PDF Extraction Tests** (`src/lib/pdf-extractor.test.ts`):
- Extract text from simple PDF
- Extract text from multi-page PDF
- Handle encrypted PDF (error case)
- Handle corrupted PDF (error case)
- Metadata extraction (title, page count)

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript property-based testing library). Each test will run a minimum of 100 iterations.

**File Validation Properties** (`src/app/page.pbt.test.tsx`):
- **Property 1**: File type validation (generate random MIME types)
- **Property 2**: File display information (generate random filenames and sizes)
- **Property 3**: File removal resets state (generate random file states)
- **Property 4**: PDF upload disables prompt (generate random PDF files)

**PDF Extraction Properties** (`src/lib/pdf-extractor.pbt.test.ts`):
- **Property 5**: PDF text extraction returns string (generate random valid PDFs)
- **Property 6**: Text structure preservation (generate PDFs with known structure)
- **Property 7**: Image metadata detection (generate PDFs with/without images)
- **Property 8**: Extraction error handling (generate invalid PDFs)

**Prompt Building Properties** (`src/lib/prompt-builder.pbt.test.ts`):
- **Property 9**: PDF content in AI prompt (generate random PDF text)
- **Property 10**: PDF priority over text prompt (generate random combinations)

**API Properties** (`src/app/api/generate/route.pbt.test.ts`):
- **Property 11**: API PDF detection and processing (generate random requests)
- **Property 12**: File size validation (generate files of various sizes)
- **Property 13**: Loading state progression (test state transitions)
- **Property 14**: Error message display (generate various error conditions)

**State Management Properties** (`src/app/page.pbt.test.tsx`):
- **Property 15**: Mode switching clears state (generate random mode transitions)

### Integration Tests

Integration tests will verify end-to-end workflows:

1. **PDF Upload to Video Generation**:
   - Upload valid PDF → Extract text → Generate timeline → Display in player
   - Verify timeline contains content related to PDF

2. **Text Prompt to Video Generation** (backward compatibility):
   - Enter text prompt → Generate timeline → Display in player
   - Verify existing functionality unchanged

3. **Error Recovery Flows**:
   - Upload invalid file → See error → Upload valid file → Success
   - Upload large file → See error → Upload smaller file → Success

### Test Configuration

**Property-Based Test Settings**:
```typescript
// fast-check configuration
fc.assert(
  fc.property(/* generators */, (/* inputs */) => {
    // property test
  }),
  { numRuns: 100 } // Minimum 100 iterations
);
```

**Test Tags**:
Each property test will include a comment tag:
```typescript
// Feature: pdf-upload-integration, Property 1: File type validation
```

### Testing Dependencies

**New Dependencies**:
- `fast-check`: Property-based testing library
- `@testing-library/react`: React component testing
- `@testing-library/user-event`: User interaction simulation
- `vitest` or `jest`: Test runner (if not already present)

**Mock Requirements**:
- Mock `unpdf` library for unit tests
- Mock Gemini API responses
- Mock File and FileReader APIs for frontend tests

### Coverage Goals

- **Unit Test Coverage**: 80%+ for new code
- **Property Test Coverage**: All 15 correctness properties implemented
- **Integration Test Coverage**: All critical user flows
- **Backward Compatibility**: All existing tests must pass

## Implementation Notes

### Library Selection Rationale

**unpdf** was chosen for PDF extraction because:
- Serverless-optimized (works in Next.js API routes)
- Modern alternative to unmaintained `pdf-parse`
- Built on Mozilla's PDF.js (battle-tested)
- Supports Node.js, Deno, Bun, and browser environments
- Simple API with `extractText()` and `extractMetadata()`
- Active maintenance and updates

### Performance Considerations

1. **File Size Limit**: 10MB limit prevents excessive memory usage and processing time
2. **Text Extraction**: `unpdf` is optimized for serverless environments
3. **Streaming**: Consider streaming large PDFs if 10MB limit proves restrictive
4. **Caching**: Consider caching extracted text for repeated requests (future enhancement)

### Security Considerations

1. **File Type Validation**: Validate MIME type on both frontend and backend
2. **File Size Validation**: Enforce limits to prevent DoS attacks
3. **Content Sanitization**: Sanitize extracted text before sending to AI
4. **API Key Protection**: Ensure Gemini API key is server-side only
5. **Error Messages**: Don't expose internal system details in user-facing errors

### Accessibility

1. **File Input**: Ensure file input is keyboard accessible
2. **Error Messages**: Use ARIA live regions for dynamic error messages
3. **Loading States**: Provide screen reader announcements for state changes
4. **Focus Management**: Maintain logical focus order during mode switching

### Future Enhancements

1. **Multi-file Upload**: Support uploading multiple PDFs
2. **PDF Preview**: Show thumbnail or first page preview
3. **OCR Support**: Extract text from scanned PDFs using OCR
4. **Progress Tracking**: Show extraction progress for large files
5. **PDF Caching**: Cache extracted content to avoid re-processing
6. **Format Support**: Extend to support DOCX, PPTX, etc.
