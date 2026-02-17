import fs from "fs";
import path from "path";

// ElevenLabs Configuration
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — natural, clear female voice
const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";

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
 * Builds a folder name from the prompt, mode, and current date.
 * Format: {sanitized_prompt}_{type}_{YYYY-MM-DD}
 */
function buildFolderName(prompt: string, mode: string): string {
  const sanitizedPrompt = sanitizeFolderName(prompt);
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `${sanitizedPrompt}_${mode}_${date}`;
}

/**
 * Generates an audio file from text using ElevenLabs TTS API.
 * Returns the public URL path of the generated audio file.
 */
export async function generateTTS(
  text: string,
  slideId: string,
  folderName: string
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  const fileName = `${slideId}.mp3`;
  const audioDir = path.join(process.cwd(), "public", "audio", folderName);
  const filePath = path.join(audioDir, fileName);

  // Ensure the directory exists
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Call ElevenLabs API
  const response = await fetch(
    `${ELEVENLABS_API_URL}/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `ElevenLabs API error (${response.status}): ${errorBody}`
    );
  }

  // Save the audio buffer to disk
  const audioBuffer = new Uint8Array(await response.arrayBuffer());
  fs.writeFileSync(filePath, audioBuffer);

  console.log(`  ✓ Generated: /audio/${folderName}/${fileName}`);
  return `/audio/${folderName}/${fileName}`;
}

/**
 * Extracts narration text from a slide based on its type.
 */
function getNarrationText(slide: any): string {
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
    case "dualQuiz":
    case "singleQuiz":
      return `${slide.question}. Is it: ${slide.options.join(", or ")}?`;
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
  mode: string = "education"
) {
  const folderName = buildFolderName(prompt, mode);
  console.log(`Generating ElevenLabs narration → /audio/${folderName}/`);

  // Process slides sequentially to avoid rate limiting
  for (let index = 0; index < timeline.slides.length; index++) {
    const slide = timeline.slides[index];
    const text = getNarrationText(slide);
    if (text) {
      try {
        const narrationUrl = await generateTTS(text, `slide-${index}`, folderName);
        slide.narrationUrl = narrationUrl;
      } catch (error) {
        console.error(`Failed to generate TTS for slide ${index}:`, error);
      }
    }
  }
}
