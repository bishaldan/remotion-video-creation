# Requirements Document

## Introduction

This feature adds PDF upload functionality to the educational video generator, allowing users to either generate videos from their own PDF documents or continue using AI-generated content from text prompts. The system will extract text and structure from uploaded PDFs and use that content to generate educational video timelines.

## Glossary

- **PDF_Uploader**: The UI component that handles PDF file selection and upload
- **PDF_Extractor**: The backend service that extracts text and metadata from PDF files
- **Timeline_Generator**: The AI service (Gemini) that creates video timelines from content
- **Generation_API**: The `/api/generate` endpoint that orchestrates PDF processing and timeline generation
- **Video_Player**: The Remotion player component that previews generated videos
- **System**: The entire educational video generation application

## Requirements

### Requirement 1: PDF Upload Interface

**User Story:** As a user, I want to upload PDF files through the UI, so that I can generate educational videos from my own documents.

#### Acceptance Criteria

1. WHEN a user visits the home page, THE PDF_Uploader SHALL display a file input control that accepts PDF files
2. WHEN a user selects a PDF file, THE PDF_Uploader SHALL validate that the file type is "application/pdf"
3. WHEN a user selects a non-PDF file, THE PDF_Uploader SHALL display an error message and prevent upload
4. WHEN a PDF file is selected, THE PDF_Uploader SHALL display the filename and file size to the user
5. WHEN a user wants to remove the selected PDF, THE PDF_Uploader SHALL provide a clear button to reset the selection
6. WHERE a PDF is uploaded, THE System SHALL disable the text prompt input to avoid confusion
7. WHERE no PDF is uploaded, THE System SHALL allow text prompt input as the current behavior

### Requirement 2: PDF Content Extraction

**User Story:** As a developer, I want to extract text content from uploaded PDFs, so that the AI can generate relevant video timelines.

#### Acceptance Criteria

1. WHEN a PDF file is uploaded to the Generation_API, THE PDF_Extractor SHALL extract all text content from the PDF
2. WHEN extracting text, THE PDF_Extractor SHALL preserve paragraph structure and headings where possible
3. WHEN a PDF contains images or diagrams, THE PDF_Extractor SHALL note their presence in the extracted metadata
4. IF a PDF is encrypted or password-protected, THEN THE PDF_Extractor SHALL return an error message
5. IF a PDF extraction fails, THEN THE Generation_API SHALL return a descriptive error to the user
6. WHEN extraction is complete, THE PDF_Extractor SHALL return the full text content as a string

### Requirement 3: AI Prompt Enhancement

**User Story:** As a system, I want to provide PDF content to the AI model, so that generated videos accurately reflect the document's content.

#### Acceptance Criteria

1. WHEN a PDF is provided, THE Timeline_Generator SHALL receive the extracted PDF text in the prompt
2. WHEN no PDF is provided, THE Timeline_Generator SHALL generate content based on the user's text prompt
3. WHEN PDF content is provided, THE System SHALL prepend instructions to the AI prompt stating "Generate a video timeline based on the following PDF content"
4. WHEN PDF content is provided, THE System SHALL append the extracted text after the instruction
5. WHEN both PDF and text prompt are provided, THE System SHALL prioritize the PDF content and use the text prompt as supplementary context

### Requirement 4: File Upload API

**User Story:** As a frontend developer, I want an API endpoint that handles PDF uploads, so that I can send files from the UI to the backend.

#### Acceptance Criteria

1. WHEN a PDF file is uploaded, THE Generation_API SHALL accept multipart/form-data requests
2. WHEN processing a request, THE Generation_API SHALL check for the presence of a PDF file in the request
3. WHEN a PDF is present, THE Generation_API SHALL extract its content before calling the AI model
4. WHEN no PDF is present, THE Generation_API SHALL process the text prompt as before
5. WHEN file size exceeds 10MB, THE Generation_API SHALL reject the upload with an error message

### Requirement 5: User Feedback and Loading States

**User Story:** As a user, I want to see progress indicators during PDF processing, so that I know the system is working.

#### Acceptance Criteria

1. WHEN a user clicks "Generate Video" with a PDF, THE System SHALL display a loading indicator
2. WHILE processing a PDF, THE System SHALL show a message indicating "Extracting PDF content..."
3. WHILE generating the timeline, THE System SHALL show a message indicating "Generating video timeline..."
4. WHEN PDF extraction completes, THE System SHALL update the loading message to reflect the current stage
5. IF an error occurs during PDF processing, THEN THE System SHALL display a clear error message with the reason

### Requirement 6: Backward Compatibility

**User Story:** As an existing user, I want the current text-prompt functionality to continue working, so that I can still generate videos without PDFs.

#### Acceptance Criteria

1. WHEN no PDF is uploaded, THE System SHALL function exactly as it does currently
2. WHEN a user enters a text prompt without a PDF, THE Generation_API SHALL process it using the existing logic
3. WHEN the PDF upload feature is added, THE System SHALL not break any existing functionality
4. WHEN a user switches between PDF and text prompt modes, THE System SHALL clear previous inputs appropriately
