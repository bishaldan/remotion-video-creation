# Implementation Plan: PDF Upload Integration

## Overview

This implementation plan breaks down the PDF upload integration feature into discrete, incremental coding tasks. Each task builds on previous work and includes testing to validate functionality early. The implementation uses TypeScript/React for the frontend and Next.js API routes for the backend.

## Tasks

- [x] 1. Install dependencies and set up PDF extraction
  - Install `unpdf` package for PDF text extraction
  - Install `fast-check` for property-based testing
  - Install testing libraries if not present (`@testing-library/react`, `@testing-library/user-event`, `vitest`)
  - Verify installations work correctly
  - _Requirements: 2.1, 2.6_

- [x] 2. Create PDF extraction utility module
  - [x] 2.1 Create `src/lib/pdf-extractor.ts` with extraction functions
    - Implement `extractPDFContent(fileBuffer: ArrayBuffer)` function
    - Use `unpdf.extractText()` with `mergePages: true`
    - Use `unpdf.extractMetadata()` for metadata
    - Return structured object with text and metadata
    - _Requirements: 2.1, 2.2, 2.6_
  
  - [ ]* 2.2 Write property test for PDF text extraction
    - **Property 5: PDF text extraction returns string**
    - **Validates: Requirements 2.1, 2.6**
    - Generate random valid PDFs and verify extraction returns non-empty strings
  
  - [ ]* 2.3 Write property test for text structure preservation
    - **Property 6: Text structure preservation**
    - **Validates: Requirements 2.2**
    - Generate PDFs with known structure and verify preservation
  
  - [ ]* 2.4 Write property test for image metadata detection
    - **Property 7: Image metadata detection**
    - **Validates: Requirements 2.3**
    - Generate PDFs with/without images and verify metadata
  
  - [ ]* 2.5 Write unit tests for error cases
    - Test encrypted PDF handling
    - Test corrupted PDF handling
    - Test empty PDF handling
    - _Requirements: 2.4, 2.5_

- [x] 3. Create prompt builder utility
  - [x] 3.1 Create `src/lib/prompt-builder.ts` with prompt construction logic
    - Implement `buildPrompt()` function
    - Handle PDF-only mode (with extracted text)
    - Handle text-only mode (existing behavior)
    - Handle combined mode (PDF + supplementary prompt)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 3.2 Write property test for PDF content in AI prompt
    - **Property 9: PDF content in AI prompt**
    - **Validates: Requirements 3.1, 3.3, 3.4**
    - Generate random PDF text and verify prompt structure
  
  - [ ]* 3.3 Write property test for PDF priority
    - **Property 10: PDF priority over text prompt**
    - **Validates: Requirements 3.5**
    - Generate random combinations and verify PDF is prioritized
  
  - [ ]* 3.4 Write unit tests for prompt builder
    - Test PDF-only prompt format
    - Test text-only prompt format (backward compatibility)
    - Test combined prompt format
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update API route to handle PDF uploads
  - [x] 5.1 Modify `src/app/api/generate/route.ts` to accept FormData
    - Add logic to detect if request contains PDF file
    - Extract PDF file from FormData if present
    - Convert File to ArrayBuffer for processing
    - Call `extractPDFContent()` if PDF is present
    - Use `buildPrompt()` to construct appropriate prompt
    - Maintain backward compatibility for JSON requests
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Add file size validation
    - Check file size before processing
    - Return 400 error if file exceeds 10MB
    - _Requirements: 4.5_
  
  - [x] 5.3 Add error handling for PDF extraction
    - Wrap extraction in try-catch
    - Return descriptive error messages
    - Log errors for debugging
    - _Requirements: 2.5_
  
  - [ ]* 5.4 Write property test for API PDF detection
    - **Property 11: API PDF detection and processing**
    - **Validates: Requirements 4.2, 4.3**
    - Generate random requests with/without PDFs
  
  - [ ]* 5.5 Write property test for file size validation
    - **Property 12: File size validation**
    - **Validates: Requirements 4.5**
    - Generate files of various sizes and verify rejection over 10MB
  
  - [ ]* 5.6 Write unit tests for API route
    - Test request with text prompt only (backward compatibility)
    - Test request with PDF only
    - Test request with both PDF and text prompt
    - Test request with neither (error case)
    - Test error responses have correct status codes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add PDF upload UI to frontend
  - [x] 7.1 Add state management for PDF upload in `src/app/page.tsx`
    - Add `pdfFile` state (File | null)
    - Add `uploadMode` state ("prompt" | "pdf")
    - Add file validation logic
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 7.2 Create file input UI component
    - Add file input with accept=".pdf"
    - Add drag-and-drop support (optional enhancement)
    - Display selected filename and file size
    - Add clear/remove button
    - Style to match existing UI theme
    - _Requirements: 1.1, 1.4, 1.5_
  
  - [x] 7.3 Implement mode switching logic
    - Disable prompt input when PDF is selected
    - Enable prompt input when no PDF is selected
    - Clear previous input when switching modes
    - _Requirements: 1.6, 1.7, 6.4_
  
  - [ ]* 7.4 Write property test for file type validation
    - **Property 1: File type validation**
    - **Validates: Requirements 1.2, 1.3**
    - Generate random MIME types and verify validation
  
  - [ ]* 7.5 Write property test for file display
    - **Property 2: File display information**
    - **Validates: Requirements 1.4**
    - Generate random filenames/sizes and verify display
  
  - [ ]* 7.6 Write property test for file removal
    - **Property 3: File removal resets state**
    - **Validates: Requirements 1.5**
    - Generate random file states and verify reset
  
  - [ ]* 7.7 Write property test for prompt disabling
    - **Property 4: PDF upload disables prompt**
    - **Validates: Requirements 1.6**
    - Generate random PDF files and verify input disabled
  
  - [ ]* 7.8 Write property test for mode switching
    - **Property 15: Mode switching clears state**
    - **Validates: Requirements 6.4**
    - Generate random mode transitions and verify state clearing
  
  - [ ]* 7.9 Write unit tests for UI components
    - Test file input renders on page load
    - Test valid PDF selection updates state
    - Test invalid file shows error
    - Test clear button functionality
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 8. Update form submission to handle PDF uploads
  - [x] 8.1 Modify `handleGenerate` function in `src/app/page.tsx`
    - Check if PDF file is present
    - Create FormData if PDF is present
    - Append PDF file to FormData
    - Append text prompt to FormData if provided
    - Send FormData instead of JSON when PDF is present
    - Maintain JSON request for text-only mode
    - _Requirements: 4.1, 4.2_
  
  - [x] 8.2 Add loading state management
    - Add loading message state
    - Update message during PDF extraction: "Extracting PDF content..."
    - Update message during generation: "Generating video timeline..."
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 8.3 Add error handling for PDF uploads
    - Display error messages from API
    - Handle network errors
    - Handle file read errors
    - _Requirements: 5.5_
  
  - [ ]* 8.4 Write property test for loading state progression
    - **Property 13: Loading state progression**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - Test state transitions through extraction and generation
  
  - [ ]* 8.5 Write property test for error message display
    - **Property 14: Error message display**
    - **Validates: Requirements 5.5**
    - Generate various error conditions and verify messages
  
  - [ ]* 8.6 Write unit tests for form submission
    - Test submission with PDF only
    - Test submission with text prompt only
    - Test submission with both PDF and prompt
    - Test error handling
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Integration testing
  - [ ]* 10.1 Write integration test for PDF upload to video generation
    - Upload valid PDF → Extract text → Generate timeline → Display in player
    - Verify timeline contains content related to PDF
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2, 4.3_
  
  - [ ]* 10.2 Write integration test for backward compatibility
    - Enter text prompt → Generate timeline → Display in player
    - Verify existing functionality unchanged
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 10.3 Write integration test for error recovery
    - Upload invalid file → See error → Upload valid file → Success
    - Upload large file → See error → Upload smaller file → Success
    - _Requirements: 1.3, 4.5, 5.5_

- [x] 11. Final testing and validation
  - [x] 11.1 Manual testing of complete flow
    - Test PDF upload with various PDF files
    - Test text prompt mode (backward compatibility)
    - Test error scenarios
    - Test UI responsiveness and accessibility
    - _Requirements: All_
  
  - [x] 11.2 Update documentation
    - Add README section about PDF upload feature
    - Document supported PDF formats and limitations
    - Document file size limits
    - _Requirements: All_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end user flows
- Backward compatibility is maintained throughout (Requirements 6.1, 6.2, 6.3)
