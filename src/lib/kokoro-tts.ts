import fs from "fs";
import { KokoroTTS } from "kokoro-js";
import path from "path";

// Kokoro Configuration
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX"; // Or "hexgrad/Kokoro-82M" if supported by the library default

export interface KokoroOptions {
  voice?: string;
  speed?: number;
}

/**
 * Sanitizes a string to be used as a folder name.
 * Replaces special characters with hyphens and truncates to 50 chars.
 */
function sanitizeFolderName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, "")     // Remove leading/trailing hyphens
    .slice(0, 50);               // Truncate to 50 chars
}

/**
 * Strips Markdown symbols and special characters that shouldn't be spoken.
 */
function cleanTTSText(text: string): string {
  return text
    .replace(/\*\*/g, "")  // Remove bold asterisks
    .replace(/__/g, "")    // Remove bold underscores
    .replace(/\*/g, "")     // Remove single asterisks
    .replace(/_/g, "")      // Remove single underscores
    .replace(/#/g, "")      // Remove hash symbols
    .replace(/`+/g, "")     // Remove backticks
    .trim();
}

/**
 * Builds a folder name from the prompt, mode, and current date.
 * Format: {sanitized_prompt}_{type}_{YYYY-MM-DD}
 */
function buildFolderName(prompt: string, mode: string): string {
  const sanitizedPrompt = sanitizeFolderName(prompt);
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `${sanitizedPrompt}_${mode}_${date}`;
}

let tts: KokoroTTS | null = null;

async function getTTSModel() {
    if (!tts) {
        tts = await KokoroTTS.from_pretrained(MODEL_ID, {
            dtype: "fp32", // Ensure compatibility
        });
    }
    return tts;
}

/**
 * Generates an audio file from text using local Kokoro TTS (via kokoro-js).
 * Returns the public URL path of the generated audio file.
 */
export async function generateTTS(
  text: string | { parts: { text: string; pauseAfter: number }[] },
  slideId: string,
  folderName: string,
  options: KokoroOptions = {}
): Promise<string> {
  const fileName = `${slideId}.wav`;
  const audioDir = path.join(process.cwd(), "public", "audio", folderName);
  const filePath = path.join(audioDir, fileName);

  // Ensure the directory exists
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  try {
    if (typeof text === 'object' && (text as any).parts) {
        await generateCombinedTTS((text as any).parts, filePath, options);
        console.log(`  ✓ Generated Combined (Local): /audio/${folderName}/${fileName}`);
        return `/audio/${folderName}/${fileName}`;
    }

    const model = await getTTSModel();
    const cleanText = cleanTTSText(text as string);
    const audio = await model.generate(cleanText, {
        voice: (options.voice || "af_bella") as any,
        speed: options.speed || 1.0,
    });

    // Save audio to file
    await audio.save(filePath);

    console.log(`  ✓ Generated (Local): /audio/${folderName}/${fileName} (Speed: ${options.speed || 1.0}, Voice: ${options.voice || "af_bella"})`);
    return `/audio/${folderName}/${fileName}`;
  } catch (error: any) {
    console.error("Local Kokoro TTS Error:", error);
    throw new Error(`Local Kokoro TTS generation failed: ${error.message}`);
  }
}

/**
 * Generates an audio file from multiple text parts joined by silence.
 */
async function generateCombinedTTS(
    parts: { text: string; pauseAfter: number }[],
    filePath: string,
    options: KokoroOptions = {}
): Promise<void> {
    const model = await getTTSModel();
    const generatedParts = [];
    
    for (const part of parts) {
        const cleanText = cleanTTSText(part.text);
        const audio = await model.generate(cleanText, {
            voice: (options.voice || "af_bella") as any,
            speed: options.speed || 1.0,
        });
        generatedParts.push({ audio, pauseAfter: part.pauseAfter });
    }

    if (generatedParts.length === 0) return;

    const samplingRate = generatedParts[0].audio.sampling_rate || 24000;
    let totalLength = 0;
    for (const p of generatedParts) {
        totalLength += p.audio.audio.length;
        totalLength += Math.floor(p.pauseAfter * samplingRate);
    }

    const combinedBuffer = new Float32Array(totalLength);
    let offset = 0;

    for (const p of generatedParts) {
        combinedBuffer.set(p.audio.audio, offset);
        offset += p.audio.audio.length;
        
        const silenceSamples = Math.floor(p.pauseAfter * samplingRate);
        if (silenceSamples > 0) {
            combinedBuffer.set(new Float32Array(silenceSamples).fill(0), offset);
            offset += silenceSamples;
        }
    }

    const RawAudio = generatedParts[0].audio.constructor as any;
    const combinedAudio = new RawAudio(combinedBuffer, samplingRate);
    await combinedAudio.save(filePath);
}

/**
 * Formats quiz options with letters (A, B, C, D) and adds a reveal for the correct answer.
 * Includes a pause before the correct answer is revealed.
 */
function formatQuizNarration(slide: any) {
  const letters = ["A", "B", "C", "D"];
  const optionsText = slide.options
    .map((opt: string, i: number) => {
        const prefix = i === slide.options.length - 1 ? "or " : "";
        return `${prefix}${letters[i]}. ${opt}.`;
    })
    .join("  ");

  const correctLetter = letters[slide.correctIndex || 0];
  const correctOption = slide.options[slide.correctIndex || 0] || "";

  return {
    parts: [
      { text: `${slide.question}. Is it: ${optionsText}?`, pauseAfter: 3 },
      { text: `Its ${correctLetter}. ${correctOption}.`, pauseAfter: 0 }
    ]
  };
}

/**
 * Extracts narration text from a slide based on its type.
 */
function getNarrationText(slide: any): string | { parts: { text: string; pauseAfter: number }[] } {
  switch (slide.type) {
    case "intro":
      return `${slide.title}. ${slide.subtitle || ""}`;
    case "text":
      return slide.text;
    case "bullets":
      return `${slide.title ? slide.title + ". " : ""}${slide.bullets.join(". ")}`;
    case "diagram":
      return `${slide.title ? slide.title + ". " : ""}This diagram shows: ${slide.nodes.map((n: any) => n.label).join(", ")}`;
    case "threeD":
      return slide.title || "Look at this 3D model.";
    case "image":
      return slide.caption || slide.imageQuery || "Look at this image.";
    case "lottie":
      return `${slide.title ? slide.title + ". " : ""}${slide.text}`;
    case "quiz":
    case "singleQuiz":
      return formatQuizNarration(slide);
    case "outro":
      return `${slide.title || ""}. ${slide.callToAction || ""}`;
    default:
      return "";
  }
}

/**
 * Iterates through all slides in a timeline and generates TTS narration.
 * Creates an organized folder based on prompt, mode, and date.
 */
export async function setNarrationUrls(
  timeline: any,
  prompt: string = "default",
  mode: string = "education",
  options: KokoroOptions = {}
) {
  const folderName = buildFolderName(prompt, mode);
  console.log(`Generating Local Kokoro narration → /audio/${folderName}/`);

  // Process slides sequentially to avoid potential memory issues with local model or file locks
  for (let index = 0; index < timeline.slides.length; index++) {
    const slide = timeline.slides[index];
    const text = getNarrationText(slide);
    if (text) {
      try {
        const narrationUrl = await generateTTS(text, `slide-${index}`, folderName, options);
        slide.narrationUrl = narrationUrl;
      } catch (error) {
        console.error(`Failed to generate TTS for slide ${index}:`, error);
      }
    }
  }
}
