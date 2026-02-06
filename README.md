# Educational Video Generator (SaaS)

Build dynamic, AI-powered educational videos using Next.js and Remotion. This project leverages Google's Gemini AI to generate video scripts from simple text prompts or PDF documents and renders them into high-quality videos with 3D animations and markdown-rich text.

## 📹 Sample Output

Check out a sample generated video:
![Demo](./public/render-1770376052292-u0ga0p.mp4)


## 🚀 Features

-   **AI-Powered Content**: Enter a topic (e.g., "The Solar System"), and Gemini AI generates a complete video script with scenes, narration, and visuals.
-   **PDF Upload Support**: Upload your own PDF documents (up to 10MB) to generate educational videos from existing content.
-   **3D Animations**: Integrated **React Three Fiber** for rendering 3D models (Atoms, Planets, Geometries) directly in the video.
-   **Markdown Support**: Text slides support bolding (`**text**`) and other formatting for professional typography.
-   **Dynamic Templates**: Includes Bullet Points, Text Overlays, Diagram, and 3D Slide templates.
-   **Cloud Ready**: Pre-configured for serverless rendering on AWS Lambda via Remotion Lambda.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Directory)
-   **Video Engine**: [Remotion](https://www.remotion.dev/)
-   **AI Model**: [Google Gemini Pro](https://ai.google.dev/)
-   **3D Engine**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) & [Drei](https://github.com/pmndrs/drei)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)

---

## 🏁 Getting Started

### 1. Prerequisites

-   Node.js 18+
-   NPM or Yarn
-   A [Google AI Studio](https://aistudio.google.com/) API Key.

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd next-saas
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your Google Gemini API key:

```bash
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### 4. Run Development Server

Start the Next.js development server. This opens the UI where you can input prompts and preview the video player.

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

---

## 🎥 Usage Guide

### Generating a Video from Text Prompt
1.  Open the dashboard at `http://localhost:3000`.
2.  In the prompt box, type a topic (e.g., *"Explain the Pythagorean theorem"*).
3.  Click **"Generate Video"**.
4.  The AI will plan the scenes, drafting text, bullet points, and even 3D object properties.
5.  Watch the preview in real-time!

### Generating a Video from PDF
1.  Open the dashboard at `http://localhost:3000`.
2.  Click **"Choose PDF File"** or drag and drop a PDF document into the upload area.
3.  Optionally, add supplementary context in the text field below.
4.  Click **"Generate Video"**.
5.  The system will extract text from your PDF and generate an educational video timeline.
6.  Watch the preview in real-time!

### 3D Slides Customization
The `ThreeDSlide` component supports various shapes and animations:
-   **Shapes**: `sphere`, `cube`, `pyramid`, `torus`, `cylinder`.
-   **Animations**: `orbit` (solar system style), `rotate`, `float`, `pulse`.
-   **Note**: Spheres have `pulse` animation disabled by design to keep atoms/planets stable.

### Text Formatting
All text inputs support basic markdown. Use double asterisks to bold key terms:
> `**Photosynthesis** is the process by which...`  
> Renders as: **Photosynthesis** is the process by which...

---

## 📄 PDF Upload Feature

### Overview
The PDF upload feature allows you to generate educational videos directly from your own PDF documents. The system extracts text content from the PDF and uses AI to create an engaging video timeline with appropriate scenes, animations, and narration.

### Supported PDF Formats

#### ✅ Supported
-   **Text-based PDFs**: Documents created from Word, LaTeX, Google Docs, or other text editors
-   **PDFs with embedded fonts**: Standard PDFs with proper font embedding
-   **Multi-page documents**: Documents of any length (up to 10MB file size)
-   **PDFs with images**: Images are noted in metadata (text extraction only)
-   **PDFs with structure**: Documents with headings, paragraphs, and sections work best

#### ❌ Not Supported
-   **Scanned PDFs without OCR**: Image-only PDFs without embedded text
-   **Password-protected PDFs**: Encrypted or password-protected documents
-   **Corrupted PDFs**: Malformed or damaged PDF files
-   **Files over 10MB**: Large files exceeding the size limit

### File Size Limits
-   **Maximum file size**: 10MB per upload
-   **Recommended size**: Under 5MB for faster processing
-   **Processing time**: Larger files take longer to extract and process

### How It Works

1.  **Upload**: Select or drag a PDF file into the upload area
2.  **Validation**: File type (`.pdf`) and size (≤10MB) are validated
3.  **Extraction**: Text content is extracted using `unpdf` library (built on Mozilla's PDF.js)
4.  **AI Processing**: Extracted text is sent to Gemini AI with context about the document
5.  **Video Generation**: AI generates a structured video timeline with scenes and animations
6.  **Preview**: Watch the generated video in the Remotion player

### Usage Tips

#### Best Practices
1.  **Use text-based PDFs**: Documents created digitally extract better than scanned images
2.  **Keep files manageable**: Files under 5MB process faster and more reliably
3.  **Use clear structure**: PDFs with headings, sections, and paragraphs generate better timelines
4.  **Add supplementary context**: Use the optional text field to guide the AI (e.g., "Focus on key concepts" or "Create a summary")
5.  **Preview before upload**: Open the PDF to ensure it's readable and not corrupted

#### Features
-   **Drag and Drop**: Simply drag a PDF file onto the upload area for quick selection
-   **File Information**: View filename and size before uploading
-   **Easy Removal**: Clear the selected file with one click
-   **Supplementary Prompts**: Add additional instructions to customize the video output
-   **Backward Compatible**: Text prompt mode continues to work exactly as before

### Troubleshooting

#### "Please select a valid PDF file"
**Cause**: The selected file is not a PDF or has an incorrect file extension.

**Solutions**:
-   Ensure the file has a `.pdf` extension
-   Verify the file is actually a PDF (not renamed from another format)
-   Try opening the PDF in a PDF reader to confirm it's valid
-   Re-save the document as a PDF from the original application

#### "File size exceeds 10MB limit"
**Cause**: The PDF file is larger than the 10MB maximum allowed size.

**Solutions**:
-   Compress the PDF using online tools (e.g., Adobe Acrobat, Smallpdf, iLovePDF)
-   Split large documents into smaller sections
-   Remove unnecessary images or pages
-   Reduce image quality/resolution in the PDF
-   Use the text prompt mode instead and paste relevant excerpts

#### "Failed to extract PDF content: The PDF is password-protected or encrypted"
**Cause**: The PDF has security restrictions preventing text extraction.

**Solutions**:
-   Remove password protection using PDF tools (if you have permission)
-   Save an unprotected copy of the document
-   Copy text manually and use the text prompt mode
-   Contact the document owner for an unprotected version

#### "Failed to extract PDF content"
**Cause**: The PDF may be corrupted, malformed, or use an unsupported format.

**Solutions**:
-   Try re-saving the PDF from the original source application
-   Convert the PDF to another format (e.g., DOCX) and back to PDF
-   Use online PDF repair tools
-   Open the PDF in a reader to verify it's not corrupted
-   Use the text prompt mode as an alternative

#### Extraction produces garbled or incorrect text
**Cause**: The PDF may be scanned without OCR or use non-standard encoding.

**Solutions**:
-   Run OCR (Optical Character Recognition) on the PDF first
-   Re-create the PDF from the original source with proper text encoding
-   Manually copy and paste text into the prompt field
-   Use a different PDF viewer to export text

### Technical Details

#### PDF Extraction Library
The application uses **unpdf** (v0.x), a modern serverless-optimized PDF extraction library:
-   Built on Mozilla's PDF.js (battle-tested and reliable)
-   Optimized for serverless environments (Next.js API routes)
-   Supports text extraction with structure preservation
-   Extracts metadata (title, author, page count)

#### Security & Privacy
-   PDF files are processed server-side and not stored permanently
-   File validation occurs on both frontend and backend
-   File size limits prevent denial-of-service attacks
-   Extracted text is sent only to the Gemini AI API
-   No PDF content is logged or retained after processing

#### Performance
-   Small PDFs (< 1MB): Process in seconds
-   Medium PDFs (1-5MB): Process in 5-15 seconds
-   Large PDFs (5-10MB): May take 15-30 seconds
-   Processing time includes extraction + AI generation

---

## 📦 Deployment & Rendering

### Local Rendering
To render a video to an MP4 file on your machine:

```bash
npx remotion render
```

### Remotion Studio
To fine-tune animations frame-by-frame:

```bash
npx remotion studio
```

### AWS Lambda Rendering
This project is set up for scalable cloud rendering.

1.  Configure your AWS credentials in `.env`.
2.  Deploy the function:
    ```bash
    node deploy.mjs
    ```
3.  Trigger renders via the API or CLI.

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request.

## 📄 License

This project is built on the [Remotion Next.js Template](https://github.com/remotion-dev/template-next). Check [Remotion's License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) for commercial usage terms.
