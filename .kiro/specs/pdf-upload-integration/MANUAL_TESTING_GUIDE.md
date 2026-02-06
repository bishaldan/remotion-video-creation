# Manual Testing Guide: PDF Upload Integration

## Overview
This guide provides comprehensive manual testing procedures for the PDF upload integration feature. Follow these test cases to verify all functionality works correctly.

## Prerequisites
- Development server running (`npm run dev`)
- Access to various PDF test files (see Test Data section below)
- Browser with developer tools open (for debugging)

---

## Test Data Required

### Valid PDF Files
1. **Small PDF** (< 1MB): Simple text document
2. **Medium PDF** (2-5MB): Multi-page document with images
3. **Large PDF** (8-9MB): Near the 10MB limit
4. **Educational PDF**: Content suitable for video generation (e.g., science topic)

### Invalid Test Files
1. **Oversized PDF** (> 10MB): To test size validation
2. **Non-PDF file**: .txt, .docx, .jpg files
3. **Encrypted PDF**: Password-protected document
4. **Corrupted PDF**: Damaged/incomplete PDF file

---

## Test Cases

### 1. PDF Upload - Basic Functionality

#### Test 1.1: Initial Page Load
**Steps:**
1. Navigate to the home page
2. Observe the PDF upload section

**Expected Results:**
- ✅ File input control is visible
- ✅ "Choose PDF File or Drag & Drop" button is displayed
- ✅ Text prompt input is enabled (not disabled)
- ✅ No error messages are shown
- ✅ "Generate Video" button is visible

**Requirements Validated:** 1.1

---

#### Test 1.2: Valid PDF Selection
**Steps:**
1. Click "Choose PDF File" button
2. Select a valid PDF file (< 10MB)
3. Observe the UI changes

**Expected Results:**
- ✅ Selected file information is displayed (filename and size)
- ✅ File size is shown in MB format (e.g., "2.45 MB")
- ✅ PDF icon is displayed next to filename
- ✅ "Remove" (X) button appears
- ✅ Text prompt input becomes disabled
- ✅ Placeholder text changes to "Add supplementary context..."
- ✅ No error messages are shown

**Requirements Validated:** 1.1, 1.2, 1.4, 1.6

---

#### Test 1.3: Invalid File Type Selection
**Steps:**
1. Click "Choose PDF File" button
2. Select a non-PDF file (.txt, .docx, .jpg)
3. Observe the error handling

**Expected Results:**
- ✅ Error message displayed: "Please select a valid PDF file"
- ✅ File is not accepted/displayed
- ✅ Text prompt input remains enabled
- ✅ Upload mode stays as "prompt"

**Requirements Validated:** 1.2, 1.3

---

#### Test 1.4: File Size Validation (Frontend)
**Steps:**
1. Click "Choose PDF File" button
2. Select a PDF file > 10MB
3. Observe the error handling

**Expected Results:**
- ✅ Error message displayed: "File size exceeds 10MB limit"
- ✅ File is not accepted/displayed
- ✅ Text prompt input remains enabled
- ✅ Upload mode stays as "prompt"

**Requirements Validated:** 1.3, 4.5

---

#### Test 1.5: File Removal
**Steps:**
1. Select a valid PDF file
2. Click the "Remove" (X) button
3. Observe the state reset

**Expected Results:**
- ✅ File information disappears
- ✅ "Choose PDF File" button reappears
- ✅ Text prompt input becomes enabled
- ✅ Upload mode switches back to "prompt"
- ✅ Any error messages are cleared
- ✅ Previous prompt text (if any) is cleared

**Requirements Validated:** 1.5, 6.4

---

### 2. Drag and Drop Functionality

#### Test 2.1: Drag Over Effect
**Steps:**
1. Drag a PDF file over the upload area
2. Observe the visual feedback
3. Release the file outside the upload area

**Expected Results:**
- ✅ Upload area highlights/changes appearance during drag
- ✅ Text changes to "Drop PDF here"
- ✅ Visual feedback is clear and responsive
- ✅ No file is uploaded when released outside

**Requirements Validated:** 1.1

---

#### Test 2.2: Successful Drop
**Steps:**
1. Drag a valid PDF file over the upload area
2. Drop the file
3. Observe the result

**Expected Results:**
- ✅ File is accepted and displayed
- ✅ Same behavior as clicking "Choose PDF File"
- ✅ File information is shown correctly
- ✅ Text prompt becomes disabled

**Requirements Validated:** 1.1, 1.4, 1.6

---

#### Test 2.3: Invalid File Drop
**Steps:**
1. Drag a non-PDF file over the upload area
2. Drop the file
3. Observe the error handling

**Expected Results:**
- ✅ Error message displayed: "Please select a valid PDF file"
- ✅ File is rejected
- ✅ Upload area returns to initial state

**Requirements Validated:** 1.2, 1.3

---

### 3. PDF Content Extraction and Generation

#### Test 3.1: PDF-Only Generation
**Steps:**
1. Upload a valid educational PDF (e.g., about photosynthesis)
2. Leave the supplementary prompt empty
3. Click "Generate Video"
4. Observe the loading states and result

**Expected Results:**
- ✅ Loading indicator appears immediately
- ✅ First message: "Extracting PDF content..."
- ✅ Second message: "Generating video timeline..."
- ✅ Video timeline is generated successfully
- ✅ Timeline content relates to the PDF content
- ✅ Success toast notification appears
- ✅ Confetti animation plays
- ✅ Video player shows the generated timeline

**Requirements Validated:** 2.1, 2.6, 3.1, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4

---

#### Test 3.2: Combined Mode (PDF + Supplementary Prompt)
**Steps:**
1. Upload a valid PDF
2. Enter supplementary text in the prompt field (e.g., "Focus on the key concepts")
3. Click "Generate Video"
4. Observe the result

**Expected Results:**
- ✅ Both PDF and prompt are processed
- ✅ Loading states progress correctly
- ✅ Generated timeline incorporates both PDF content and prompt context
- ✅ PDF content is prioritized over the supplementary prompt

**Requirements Validated:** 3.5, 4.2

---

#### Test 3.3: PDF with Images/Diagrams
**Steps:**
1. Upload a PDF containing images or diagrams
2. Click "Generate Video"
3. Observe the extraction and generation

**Expected Results:**
- ✅ PDF is processed successfully
- ✅ Text content is extracted (images are noted in metadata)
- ✅ Timeline is generated based on available text
- ✅ No errors occur due to images

**Requirements Validated:** 2.3

---

### 4. Error Scenarios

#### Test 4.1: Encrypted/Password-Protected PDF
**Steps:**
1. Upload an encrypted or password-protected PDF
2. Click "Generate Video"
3. Observe the error handling

**Expected Results:**
- ✅ Error message displayed indicating the PDF is encrypted/password-protected
- ✅ Error message is clear and actionable
- ✅ User can remove the file and try another

**Requirements Validated:** 2.4, 2.5, 5.5

---

#### Test 4.2: Corrupted PDF
**Steps:**
1. Upload a corrupted or incomplete PDF file
2. Click "Generate Video"
3. Observe the error handling

**Expected Results:**
- ✅ Error message displayed indicating extraction failure
- ✅ Error message provides helpful context
- ✅ Application remains stable (no crashes)

**Requirements Validated:** 2.5, 5.5

---

#### Test 4.3: Empty PDF
**Steps:**
1. Upload a PDF with no text content (blank pages)
2. Click "Generate Video"
3. Observe the behavior

**Expected Results:**
- ✅ PDF is processed without crashing
- ✅ Either generates minimal timeline or shows appropriate error
- ✅ User is informed of the issue

**Requirements Validated:** 2.5, 5.5

---

#### Test 4.4: Network Error During Upload
**Steps:**
1. Upload a valid PDF
2. Disable network connection (or use browser dev tools to simulate offline)
3. Click "Generate Video"
4. Observe the error handling

**Expected Results:**
- ✅ Error message displayed: "Network error during PDF upload..."
- ✅ Loading state stops
- ✅ User can retry after reconnecting

**Requirements Validated:** 5.5

---

#### Test 4.5: No Input Provided
**Steps:**
1. Ensure no PDF is uploaded
2. Ensure prompt field is empty
3. Click "Generate Video"
4. Observe the validation

**Expected Results:**
- ✅ Error message displayed: "Please upload a PDF or enter a prompt"
- ✅ No API request is made
- ✅ User is prompted to provide input

**Requirements Validated:** 4.1

---

### 5. Backward Compatibility (Text Prompt Mode)

#### Test 5.1: Text Prompt Only (No PDF)
**Steps:**
1. Ensure no PDF is uploaded
2. Enter a text prompt (e.g., "water cycle")
3. Click "Generate Video"
4. Observe the generation process

**Expected Results:**
- ✅ Loading message: "Generating video timeline..."
- ✅ Video timeline is generated successfully
- ✅ Timeline content matches the prompt topic
- ✅ Existing functionality works exactly as before
- ✅ No PDF-related UI elements interfere

**Requirements Validated:** 6.1, 6.2, 6.3

---

#### Test 5.2: Switching Between Modes
**Steps:**
1. Enter a text prompt
2. Upload a PDF (observe prompt is cleared)
3. Remove the PDF (observe mode switches back)
4. Enter a new text prompt
5. Generate video

**Expected Results:**
- ✅ Mode switching works smoothly
- ✅ Previous inputs are cleared appropriately
- ✅ No state conflicts occur
- ✅ Generation works correctly after switching

**Requirements Validated:** 1.7, 6.4

---

### 6. UI/UX and Accessibility

#### Test 6.1: Keyboard Navigation
**Steps:**
1. Use Tab key to navigate through the interface
2. Try to interact with all controls using keyboard only
3. Test file input with Enter/Space keys

**Expected Results:**
- ✅ All interactive elements are keyboard accessible
- ✅ Focus indicators are visible
- ✅ Tab order is logical
- ✅ File input can be activated with keyboard

**Requirements Validated:** Accessibility

---

#### Test 6.2: Screen Reader Compatibility
**Steps:**
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate through the PDF upload interface
3. Perform file upload and generation

**Expected Results:**
- ✅ All labels are announced correctly
- ✅ File information is readable
- ✅ Error messages are announced
- ✅ Loading states are communicated
- ✅ ARIA labels are present where needed

**Requirements Validated:** Accessibility

---

#### Test 6.3: Responsive Design
**Steps:**
1. Test on different screen sizes (desktop, tablet, mobile)
2. Resize browser window
3. Test all functionality at different sizes

**Expected Results:**
- ✅ Layout adapts to different screen sizes
- ✅ Upload area remains usable on mobile
- ✅ File information displays correctly
- ✅ All buttons are accessible and clickable

**Requirements Validated:** UI Responsiveness

---

#### Test 6.4: Visual Feedback and Loading States
**Steps:**
1. Upload a PDF and generate video
2. Observe all visual feedback throughout the process
3. Test with different file sizes

**Expected Results:**
- ✅ Loading spinner is visible during processing
- ✅ Loading messages update appropriately
- ✅ Progress is communicated clearly
- ✅ Success/error states are visually distinct
- ✅ Animations are smooth and not jarring

**Requirements Validated:** 5.1, 5.2, 5.3, 5.4

---

### 7. Edge Cases and Stress Testing

#### Test 7.1: Rapid Mode Switching
**Steps:**
1. Quickly switch between uploading PDFs and entering prompts
2. Upload, remove, upload different file rapidly
3. Observe state management

**Expected Results:**
- ✅ No race conditions occur
- ✅ State remains consistent
- ✅ No UI glitches or errors
- ✅ Latest action takes precedence

**Requirements Validated:** 6.4

---

#### Test 7.2: Special Characters in Filename
**Steps:**
1. Upload a PDF with special characters in filename (e.g., "Test@#$%.pdf")
2. Observe filename display
3. Generate video

**Expected Results:**
- ✅ Filename displays correctly
- ✅ Special characters don't break UI
- ✅ File processes normally

**Requirements Validated:** 1.4

---

#### Test 7.3: Very Long Filename
**Steps:**
1. Upload a PDF with a very long filename (> 100 characters)
2. Observe how it's displayed
3. Generate video

**Expected Results:**
- ✅ Filename is truncated or wrapped appropriately
- ✅ UI doesn't break or overflow
- ✅ File processes normally

**Requirements Validated:** 1.4

---

#### Test 7.4: Multiple Rapid Generations
**Steps:**
1. Upload a PDF and generate video
2. Immediately upload another PDF and generate again
3. Repeat several times quickly

**Expected Results:**
- ✅ Each request is handled properly
- ✅ No overlapping requests cause issues
- ✅ Loading states are accurate
- ✅ Results correspond to the correct input

**Requirements Validated:** 4.1, 4.2

---

## Browser Compatibility Testing

Test the complete flow in multiple browsers:

### Browsers to Test
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

### Key Areas to Verify
1. File input functionality
2. Drag and drop support
3. File size validation
4. Error message display
5. Loading states
6. Video generation and playback

---

## Performance Testing

### Test 8.1: Large PDF Processing Time
**Steps:**
1. Upload a PDF near the 10MB limit
2. Measure time from upload to generation complete
3. Observe memory usage in browser dev tools

**Expected Results:**
- ✅ Processing completes within reasonable time (< 30 seconds)
- ✅ No memory leaks
- ✅ Browser remains responsive

---

### Test 8.2: Multiple Page PDF
**Steps:**
1. Upload a PDF with 50+ pages
2. Generate video
3. Observe extraction and generation time

**Expected Results:**
- ✅ All pages are processed
- ✅ Text extraction is complete
- ✅ Timeline reflects content from multiple pages

---

## Security Testing

### Test 9.1: File Type Bypass Attempt
**Steps:**
1. Rename a .txt file to .pdf
2. Try to upload it
3. Observe validation

**Expected Results:**
- ✅ File is rejected based on MIME type, not just extension
- ✅ Error message is displayed
- ✅ No processing occurs

---

### Test 9.2: Malicious Content
**Steps:**
1. Upload a PDF with potentially malicious content (if available in test environment)
2. Observe handling

**Expected Results:**
- ✅ Content is sanitized
- ✅ No script execution occurs
- ✅ Application remains secure

---

## Test Results Template

Use this template to record your test results:

```
Test Case: [Test ID and Name]
Date: [Date]
Tester: [Your Name]
Browser: [Browser and Version]

Steps Performed:
1. [Step 1]
2. [Step 2]
...

Results:
✅ PASS / ❌ FAIL

Notes:
[Any observations, issues, or comments]

Screenshots:
[Attach if applicable]
```

---

## Known Issues / Limitations

Document any issues found during testing:

1. **Issue:** [Description]
   - **Severity:** High / Medium / Low
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]
   - **Workaround:** [If any]

---

## Sign-off

After completing all test cases:

- [ ] All critical test cases passed
- [ ] All error scenarios handled gracefully
- [ ] Backward compatibility verified
- [ ] Accessibility requirements met
- [ ] Cross-browser testing completed
- [ ] Performance is acceptable
- [ ] Security considerations addressed

**Tester Signature:** _______________
**Date:** _______________

**Notes:**
[Any final comments or recommendations]
