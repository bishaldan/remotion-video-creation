# Remotion Video Creation SaaS

A powerful, modern video automation platform built with **Next.js**, **Remotion**, and AI-powered tools. Create stunning, personalized videos programmatically with features like automated captioning, AI-generated imagery, and high-quality Text-to-Speech (TTS).

---

## 🚀 Quick Start & Setup (Priority)

### 1. Prerequisites
Ensure you have the following installed on your local machine:
- **Node.js**: v20 or later.
- **Python 3 & C++ Build Tools**: Required for `whisper.cpp` (transcription) and other dependencies.
- **Docker & Docker Compose**: Recommended for consistent environments.
- **FFmpeg**: Required for Remotion rendering.

### 2. Environment Configuration
Copy the template and fill in your API keys:
```bash
cp .env.local.example .env.local # If template exists, otherwise create .env.local
```

Required variables:
- `GOOGLE_GENERATIVE_AI_API_KEY`: For AI content generation (Gemini).
- `UNSPLASH_ACCESS_KEY`: For background imagery.
- `PEXELS_API_KEY` / `PIXABAY_API_KEY`: For stock assets.
- `TYPECAST_API_KEY`: For high-quality AI voices.
- `HF_TOKEN`: For Hugging Face models (e.g., Kokoro TTS).

### 3. Local Installation
```bash
npm install
```

### 4. Running the Application

#### Development Server
Start the Next.js app in development mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Remotion Studio
Preview and edit your video compositions visually:
```bash
npm run remotion
```

---

## 🐳 Docker Setup

The project includes a multi-stage Dockerfile and docker-compose for easy deployment.

### Build and Run
```bash
docker compose up --build
```
This will compile `whisper.cpp` optimized for your target architecture and start the Next.js application at `http://localhost:3000`.

---

## 🛠️ Features
- **AI-Powered Synthesis**: Generate video scripts and assets using Google Gemini.
- **automated Captions**: Uses `whisper.cpp` for fast, local audio-to-text transcription.
- **Dynamic Compositions**: Built on **Remotion**, allowing for programmatic video rendering.
- **Multi-Voice TTS**: Support for Kokoro TTS, Typecast, and more.
- **Responsive Designs**: Modern UI built with Tailwind CSS.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server. |
| `npm run remotion` | Opens the Remotion Studio for previewing compositions. |
| `npm run build` | Builds the production application. |
| `npm run render` | Renders the video compositions to a file. |
| `npm run test` | Runs unit and integration tests via Vitest. |
| `npm run lint` | Runs ESLint to check for code quality. |
| `npm run deploy` | Triggers the custom deployment script (`deploy.mjs`). |

---

## 🏗️ Project Structure
- `src/`: Core application logic, components, and hooks.
- `src/app/`: Next.js App Router pages and API routes.
- `src/lib/`: Modular libraries (TTS, Prompting, Asset fetching).
- `whisper.cpp/`: Local submodule for high-performance transcription.
- `public/`: Static assets and processed video files.

---

*Powered by [Remotion](https://www.remotion.dev/)*
