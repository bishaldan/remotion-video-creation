# AI Video Generator SaaS (Remotion + Gemini)

Build dynamic, AI-powered educational and quiz videos using Next.js and Remotion. This project leverages Google's Gemini AI to generate video scripts from text prompts or PDF documents, rendering them into high-quality videos with 3D animations, rich transitions, and modern templates.

## 🚀 Key Features

### 1. AI-Powered Content Generation
- **Prompt to Video**: Generate complete videos from simple text descriptions.
- **PDF to Video**: Extract content from PDF documents (up to 10MB) to create educational summaries.
- **Gemini 2.5 Flash**: Optimized for fast and accurate content generation.

### 2. Versatile Video Modes
- **🎓 Education Mode**: In-depth educational content with multiple slide types:
  - Text, Bullet Points, Diagrams, 3D Objects (React Three Fiber), Image (Unsplash), and Lottie Animations.
- **⚔️ Dual Quiz Mode**: Fast-paced "Option A vs B" style quizzes with fullscreen background images. Supports Landscape and Portrait orientations.
- **✨ Single Quiz Mode**: Premium side-by-side landscape layout featuring:
  - Animated bubble backgrounds.
  - Mystery image reveal (pixelated to clear).
  - Side-by-side question/image layout.

### 3. Professional Video Engineering
- **Remotion Engine**: Built on React for frame-perfect video rendering.
- **Vibrant Aesthetics**: Modern glassmorphism, smooth gradients, and rich micro-animations.
- **Transition Series**: High-quality fade and light leak transitions between scenes.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14-15](https://nextjs.org/) (App Router)
- **Video Engine**: [Remotion](https://www.remotion.dev/)
- **AI Model**: [Google Gemini AI SDK](https://ai.google.dev/)
- **3D Engine**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) & [Drei](https://github.com/pmndrs/drei)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks & Zod (Schema Validation)

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) API Key.

### 2. Installation
```bash
git clone <your-repo-url>
cd Remotion-Saas
npm install
```

### 3. Environment Setup
Create a `.env.local` file:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
or 
``` bash
docker compose up --build
```
Visit `http://localhost:3000` to start creating.
### <p style={{color:'red'}}>IMPORTANT Docker Related Issues: </p>
After generating video, If you experience no audio playback, you might need to restart the docker container with:
```bash
docker restart <container_name>
```
This is due to volume sync delay or caching within the container.
---

## 🍱 Project Architecture

The codebase has been refactored for modularity and scalability:

- **`types/`**: Modular schema definitions:
  - `shared.ts`: Global constants (FPS, Resolution) and base schemas.
  - `edu.ts`: Educational video types and default props.
  - `quiz.ts`: Unified quiz schemas (Dual and Single formats).
- **`src/remotion/compositions/`**: Reorganized main entry points:
  - `Edu/`: Main educational composition.
  - `DualQuiz/`: Two-option quiz competition format.
  - `SingleQuiz/`: Mystery reveal quiz format.
- **`src/remotion/templates/`**: Atomic slide components used across all modes.
- **`src/lib/prompts.ts`**: Centralized system prompts for AI instruction management.

---

## 🎥 Usage Guide

### Generating Educational Videos
1. Select **"Education"** mode.
2. Provide a topic or upload a PDF.
3. Click **"Generate"**. AI will mix different slide types for variety.

### Creating Quizzes
1. Select **"Quiz"** mode.
2. Choose a format:
   - **Dual**: High-speed, orientation-agnostic (Landscape/Portrait).
   - **Single**: Premium mystery reveal (Landscape only).
3. The AI generates questions, distractors, and finds matching images via Unsplash.

---

## 📄 PDF Support
- **Text Extraction**: Uses `unpdf` for reliable server-side extraction.
- **Contextual Awareness**: AI analyzes the entire PDF structure to build a coherent teaching timeline.
- **Supplementary Prompts**: Combine PDF data with custom instructions for better results.

---

## 📦 Rendering & Deployment

### Local Rendering
```bash
npx remotion render
```

### Remotion Studio
```bash
npx remotion studio
```

### AWS Lambda Rendering
Optimized for serverless scale:
1. Configure AWS credentials.
2. Deploy the function: `node deploy.mjs`
3. Renders scale horizontally to handle high traffic.

---

## 📄 License
This project is built on the Remotion Next.js Template. Check [Remotion's License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) for usage terms.
