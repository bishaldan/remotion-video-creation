# Educational Video Generator (SaaS)

Build dynamic, AI-powered educational videos using Next.js and Remotion. This project leverages Google's Gemini AI to generate video scripts from simple text prompts and renders them into high-quality videos with 3D animations and markdown-rich text.

<img src="https://github.com/remotion-dev/template-next/assets/1629785/c9c2e5ca-2637-4ec8-8e40-a8feb5740d88" width="600" alt="Remotion Template Preview" />

## 🚀 Features

-   **AI-Powered Content**: Enter a topic (e.g., "The Solar System"), and Gemini AI generates a complete video script with scenes, narration, and visuals.
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

### Generating a Video
1.  Open the dashboard at `http://localhost:3000`.
2.  In the prompt box, type a topic (e.g., *"Explain the Pythagorean theorem"*).
3.  Click **"Generate Video"**.
4.  The AI will plan the scenes, drafting text, bullet points, and even 3D object properties.
5.  Watch the preview in real-time!

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
