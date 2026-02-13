import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Typecast AI Configuration
// ─────────────────────────────────────────────────────────────────────────────
const TYPECAST_API_URL = "https://api.typecast.ai/v1/text-to-speech";
const DEFAULT_MODEL = "ssfm-v30"; // Latest model — best prosody & emotion

import { TYPECAST_VOICES } from "./voice-constants";
export { TYPECAST_VOICES };

// Default voice
const DEFAULT_VOICE_ID = "tc_60e5426de8b95f1d3000d7b5"; // Olivia

export type EmotionType = "smart" | "normal" | "happy" | "sad" | "angry" | "whisper" | "toneup" | "tonedown";

export interface TypecastOptions {
  voiceId?: string;
  speed?: number;       // audio_tempo: 0.5–2.0
  emotion?: EmotionType;
  model?: string;
}

/** Result from TTS generation including timing metadata */
export interface TTSResult {
  url: string;
  durationSeconds: number;
  revealTimeSeconds?: number; // When the answer narration begins (quiz only)
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions (mirrored from kokoro-tts.ts)
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeFolderName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

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

function buildFolderName(prompt: string, voiceName: string): string {
  const sanitizedPrompt = sanitizeFolderName(prompt);
  const date = new Date().toISOString().split("T")[0];
  return `typecast/${date}/${voiceName}/${sanitizedPrompt}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all available voices from your Typecast account.
 * Useful for discovering voice_ids to add to the TYPECAST_VOICES map.
 */
export async function fetchAvailableVoices(): Promise<any[]> {
  const apiKey = process.env.TYPECAST_API_KEY;
  if (!apiKey) throw new Error("TYPECAST_API_KEY environment variable is not set");

  const response = await fetch("https://api.typecast.ai/v2/voices", {
    method: "GET",
    headers: { "X-API-KEY": apiKey },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Typecast voices API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.result || data;
}

/**
 * Calls the Typecast AI text-to-speech API and returns the audio buffer.
 */
async function callTypecastAPI(
  text: string,
  options: TypecastOptions = {}
): Promise<Buffer> {
  const apiKey = process.env.TYPECAST_API_KEY;
  if (!apiKey) {
    throw new Error("TYPECAST_API_KEY environment variable is not set");
  }

  const voiceId = options.voiceId || DEFAULT_VOICE_ID;
  const model = options.model || DEFAULT_MODEL;

  const body: Record<string, any> = {
    voice_id: voiceId,
    text: cleanTTSText(text),
    model: model,
    language: "eng",
    prompt: options.emotion === "smart" 
      ? { emotion_type: "smart" }
      : { 
          emotion_type: "preset",
          emotion_preset: options.emotion || "normal"
        },
    output: {
      audio_format: "wav",
      audio_tempo: options.speed || 1.0,
    },
  };

  const response = await fetch(TYPECAST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Typecast AI API error (${response.status}): ${errorBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Estimates audio duration from a WAV buffer.
 * Reads the WAV header to get sample rate, channels, and bits per sample.
 */
function getWavDuration(buffer: Buffer): number {
  if (buffer.length < 44) return 0; // Minimum WAV header size

  // WAV header: bytes 24-27 = sample rate, 34-35 = bits per sample, 22-23 = channels
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);
  const numChannels = buffer.readUInt16LE(22);

  // Data size is total buffer minus 44-byte header
  const dataSize = buffer.length - 44;
  const bytesPerSample = bitsPerSample / 8;

  if (sampleRate === 0 || bytesPerSample === 0 || numChannels === 0) return 0;

  return dataSize / (sampleRate * numChannels * bytesPerSample);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core TTS Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates an audio file from text using Typecast AI TTS.
 * Returns the public URL path AND the audio duration in seconds.
 */
export async function generateTTS(
  text: string | { parts: { text: string; pauseAfter: number }[] },
  slideId: string,
  folderName: string,
  options: TypecastOptions = {}
): Promise<TTSResult> {
  const fileName = `${slideId}.wav`;
  const audioDir = path.join(process.cwd(), "public", "audio", folderName);
  const filePath = path.join(audioDir, fileName);

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  try {
    // Determine model if not provided
    if (!options.model && options.voiceId && TYPECAST_VOICES[options.voiceId]) {
        options.model = TYPECAST_VOICES[options.voiceId].model;
    }

    if (typeof text === "object" && (text as any).parts) {
      const result = await generateCombinedTTS((text as any).parts, filePath, options);
      const url = `/audio/${folderName}/${fileName}`;
      console.log(`  ✓ Generated Combined (Typecast): ${url} (${result.durationSeconds.toFixed(1)}s, reveal@${result.revealTimeSeconds?.toFixed(1) ?? "N/A"}s)`);
      return { url, ...result };
    }

    const audioBuffer = await callTypecastAPI(text as string, options);
    fs.writeFileSync(filePath, audioBuffer);

    const durationSeconds = getWavDuration(audioBuffer);

    const url = `/audio/${folderName}/${fileName}`;
    console.log(`  ✓ Generated (Typecast): ${url} (${durationSeconds.toFixed(1)}s, Voice: ${options.voiceId || DEFAULT_VOICE_ID}, Emotion: ${options.emotion || "smart"})`);
    return { url, durationSeconds };
  } catch (error: any) {
    console.error("Typecast AI TTS Error:", error);
    throw new Error(`Typecast AI TTS generation failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined Audio (Quiz Support)
// ─────────────────────────────────────────────────────────────────────────────

interface CombinedTTSResult {
  durationSeconds: number;
  revealTimeSeconds?: number;
}

/**
 * Generates audio from multiple text parts joined by silence.
 * Tracks cumulative timing so we know exactly when each part starts.
 */
async function generateCombinedTTS(
  parts: { text: string; pauseAfter: number }[],
  filePath: string,
  options: TypecastOptions = {}
): Promise<CombinedTTSResult> {
  const audioBuffers: { buffer: Buffer; pauseAfter: number }[] = [];

  for (const part of parts) {
    const buffer = await callTypecastAPI(part.text, options);
    audioBuffers.push({ buffer, pauseAfter: part.pauseAfter });
  }

  if (audioBuffers.length === 0) return { durationSeconds: 0 };

  // Read sample rate from the first buffer's WAV header
  const sampleRate = audioBuffers[0].buffer.readUInt32LE(24);
  const bitsPerSample = audioBuffers[0].buffer.readUInt16LE(34);
  const numChannels = audioBuffers[0].buffer.readUInt16LE(22);
  const bytesPerSample = bitsPerSample / 8;

  // Extract raw PCM data from each WAV (skip 44-byte header)
  const pcmParts: { data: Buffer; pauseAfter: number }[] = audioBuffers.map((ab) => ({
    data: ab.buffer.subarray(44),
    pauseAfter: ab.pauseAfter,
  }));

  // Calculate total length and track part start times
  let totalBytes = 0;
  const partStartTimes: number[] = [];

  for (const p of pcmParts) {
    partStartTimes.push(totalBytes / (sampleRate * numChannels * bytesPerSample));
    totalBytes += p.data.length;
    const silenceBytes = Math.floor(p.pauseAfter * sampleRate * numChannels * bytesPerSample);
    totalBytes += silenceBytes;
  }

  // Build combined PCM buffer
  const combinedPCM = Buffer.alloc(totalBytes);
  let offset = 0;

  for (const p of pcmParts) {
    p.data.copy(combinedPCM, offset);
    offset += p.data.length;

    const silenceBytes = Math.floor(p.pauseAfter * sampleRate * numChannels * bytesPerSample);
    if (silenceBytes > 0) {
      // Silence is already zeros from Buffer.alloc
      offset += silenceBytes;
    }
  }

  // Build WAV file with proper header
  const wavBuffer = createWavBuffer(combinedPCM, sampleRate, numChannels, bitsPerSample);
  fs.writeFileSync(filePath, wavBuffer);

  const durationSeconds = totalBytes / (sampleRate * numChannels * bytesPerSample);
  const revealTimeSeconds = partStartTimes.length > 1
    ? partStartTimes[partStartTimes.length - 1]
    : undefined;

  return { durationSeconds, revealTimeSeconds };
}

/**
 * Creates a WAV file buffer from raw PCM data.
 */
function createWavBuffer(
  pcmData: Buffer,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number
): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmData.length;
  const bytesPerSample = bitsPerSample / 8;

  // RIFF header
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  // fmt sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);                                    // Sub-chunk size
  header.writeUInt16LE(1, 20);                                     // PCM format
  header.writeUInt16LE(numChannels, 22);                           // Channels
  header.writeUInt32LE(sampleRate, 24);                            // Sample rate
  header.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // Byte rate
  header.writeUInt16LE(numChannels * bytesPerSample, 32);          // Block align
  header.writeUInt16LE(bitsPerSample, 34);                         // Bits per sample

  // data sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide Narration (mirrored from kokoro-tts.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats quiz options with letters (A, B, C, D) and adds a reveal for the correct answer.
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
  const pauseDuration = Math.max(2, Math.min(5, optionCount + 1));

  return {
    parts: [
      { text: `${slide.question}. Is it: ${optionsText}?`, pauseAfter: pauseDuration },
      { text: `Its ${correctLetter}. ${correctOption}.`, pauseAfter: 0 },
    ],
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
  voiceId: string = "tc_6791c4a4c79515dea68b4a75"
) {
  const voiceName = TYPECAST_VOICES[voiceId]?.name || voiceId;
  const folderName = buildFolderName(prompt, voiceName);
  const options: TypecastOptions = { voiceId };
  console.log(`Generating Typecast AI narration (voice: ${voiceName}) → /audio/${folderName}/`);

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
          slide.durationInSeconds = Math.round((audioDuration + 1.5) * 2) / 2;
          slide.revealTimeSeconds = result.revealTimeSeconds;
          console.log(`    → Slide ${index}: duration=${slide.durationInSeconds}s, reveal@${slide.revealTimeSeconds?.toFixed(1)}s`);
        }
      } catch (error) {
        console.error(`Failed to generate TTS for slide ${index}:`, error);
      }
    }
  }
}
