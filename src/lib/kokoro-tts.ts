import fs from "fs";
import { KokoroTTS } from "kokoro-js";
import path from "path";

// Kokoro Configuration
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

export interface KokoroOptions {
  voice?: string;
  speed?: number;
}

/** Result from TTS generation including timing metadata */
export interface TTSResult {
  url: string;
  durationSeconds: number;
  revealTimeSeconds?: number; // When the answer narration begins (quiz only)
}

/**
 * Sanitizes a string to be used as a folder name.
 */
function sanitizeFolderName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Strips Markdown symbols and special characters that shouldn't be spoken.
 */
function cleanTTSText(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\*/g, "")
    .replace(/_/g, "")
    .replace(/#/g, "")
    .replace(/`+/g, "")
    .trim();
}

/**
 * Builds a folder name from the prompt, mode, and current date.
 */
function buildFolderName(prompt: string, mode: string): string {
  const sanitizedPrompt = sanitizeFolderName(prompt);
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedPrompt}_${mode}_${date}`;
}

let tts: KokoroTTS | null = null;

async function getTTSModel() {
    if (!tts) {
        tts = await KokoroTTS.from_pretrained(MODEL_ID, {
            dtype: "fp32",
        });
    }
    return tts;
}

/**
 * Calculates audio duration in seconds from a Float32Array buffer and sample rate.
 */
function getAudioDuration(audioData: Float32Array, sampleRate: number): number {
    return audioData.length / sampleRate;
}

/**
 * Generates an audio file from text using local Kokoro TTS.
 * Returns the public URL path AND the audio duration in seconds.
 */
export async function generateTTS(
  text: string | { parts: { text: string; pauseAfter: number }[] },
  slideId: string,
  folderName: string,
  options: KokoroOptions = {}
): Promise<TTSResult> {
  const fileName = `${slideId}.wav`;
  const audioDir = path.join(process.cwd(), "public", "audio", folderName);
  const filePath = path.join(audioDir, fileName);

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  try {
    if (typeof text === 'object' && (text as any).parts) {
        const result = await generateCombinedTTS((text as any).parts, filePath, options);
        const url = `/audio/${folderName}/${fileName}`;
        console.log(`  ✓ Generated Combined (Local): ${url} (${result.durationSeconds.toFixed(1)}s, reveal@${result.revealTimeSeconds?.toFixed(1) ?? 'N/A'}s)`);
        return { url, ...result };
    }

    const model = await getTTSModel();
    const cleanText = cleanTTSText(text as string);
    const audio = await model.generate(cleanText, {
        voice: (options.voice || "af_bella") as any,
        speed: options.speed || 1.0,
    });

    await audio.save(filePath);

    const sampleRate = audio.sampling_rate || 24000;
    const durationSeconds = getAudioDuration(audio.audio, sampleRate);

    const url = `/audio/${folderName}/${fileName}`;
    console.log(`  ✓ Generated (Local): ${url} (${durationSeconds.toFixed(1)}s, Speed: ${options.speed || 1.0}, Voice: ${options.voice || "af_bella"})`);
    return { url, durationSeconds };
  } catch (error: any) {
    console.error("Local Kokoro TTS Error:", error);
    throw new Error(`Local Kokoro TTS generation failed: ${error.message}`);
  }
}

/**
 * Result from combined TTS generation, including duration and reveal timing.
 */
interface CombinedTTSResult {
    durationSeconds: number;
    revealTimeSeconds?: number;
}

/**
 * Generates an audio file from multiple text parts joined by silence.
 * Tracks cumulative timing so we know exactly when each part starts.
 */
async function generateCombinedTTS(
    parts: { text: string; pauseAfter: number }[],
    filePath: string,
    options: KokoroOptions = {}
): Promise<CombinedTTSResult> {
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

    if (generatedParts.length === 0) return { durationSeconds: 0 };

    const samplingRate = generatedParts[0].audio.sampling_rate || 24000;
    
    // Track cumulative timing to find the reveal point
    let totalLength = 0;
    const partStartTimes: number[] = [];
    
    for (const p of generatedParts) {
        partStartTimes.push(totalLength / samplingRate); // Start time of this part in seconds
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

    const durationSeconds = totalLength / samplingRate;
    
    // The reveal time is when the LAST part (answer) starts playing
    // For quiz narration: part[0] = question, part[1] = answer
    const revealTimeSeconds = partStartTimes.length > 1 
        ? partStartTimes[partStartTimes.length - 1] 
        : undefined;

    return { durationSeconds, revealTimeSeconds };
}

/**
 * Formats quiz options with letters (A, B, C, D) and adds a reveal for the correct answer.
 * Pause duration scales with the number of options for thinking time.
 */
function formatQuizNarration(slide: any) {
  const letters = ["A", "B", "C", "D"];
  const optionCount = slide.options.length;
  
  const optionsText = slide.options
    .map((opt: string, i: number) => {
        const prefix = i === slide.options.length - 1 ? "or " : "";
        return `${prefix}${letters[i]}. ${opt}.`;
    })
    .join("  ");

  const correctLetter = letters[slide.correctIndex || 0];
  const correctOption = slide.options[slide.correctIndex || 0] || "";

  // Dynamic pause: scales with number of options (2 opts → 3s, 4 opts → 5s)
  const pauseDuration = Math.max(2, Math.min(5, optionCount + 1));

  return {
    parts: [
      { text: `${slide.question}. Is it: ${optionsText}?`, pauseAfter: pauseDuration },
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
 * Sets slide duration and revealTimeSeconds from actual audio length.
 */
export async function setNarrationUrls(
  timeline: any,
  prompt: string = "default",
  mode: string = "education",
  options: KokoroOptions = {}
) {
  const folderName = buildFolderName(prompt, mode);
  console.log(`Generating Local Kokoro narration → /audio/${folderName}/`);

  for (let index = 0; index < timeline.slides.length; index++) {
    const slide = timeline.slides[index];
    const text = getNarrationText(slide);
    if (text) {
      try {
        const result = await generateTTS(text, `slide-${index}`, folderName, options);
        slide.narrationUrl = result.url;

        // For quiz slides: override duration with actual audio length + buffer
        const isQuiz = slide.type === "quiz" || slide.type === "singleQuiz";
        if (isQuiz) {
          const audioDuration = result.durationSeconds;
          // Add 1.5s buffer after audio ends for visual breathing room
          slide.durationInSeconds = Math.round((audioDuration + 1.5) * 2) / 2; // Round to nearest 0.5s
          slide.revealTimeSeconds = result.revealTimeSeconds;
          console.log(`    → Slide ${index}: duration=${slide.durationInSeconds}s, reveal@${slide.revealTimeSeconds?.toFixed(1)}s`);
        }
      } catch (error) {
        console.error(`Failed to generate TTS for slide ${index}:`, error);
      }
    }
  }
}
