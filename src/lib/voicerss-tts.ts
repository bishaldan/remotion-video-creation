import fs from "fs";
import path from "path";

// VoiceRSS Configuration
const VOICERSS_API_URL = "http://api.voicerss.org/";
const LANGUAGE = "en-us";
const VOICE = "Amy"; // Modern English voice
const CODEC = "MP3";
const FORMAT = "44khz_16bit_stereo";

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
 * Generates an audio file from text using VoiceRSS API.
 * Returns the public URL path of the generated audio file.
 */
export async function generateTTS(
  text: string,
  slideId: string,
  folderName: string
): Promise<string> {
  const apiKey = process.env.VOICERSS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("VOICERSS_API_KEY environment variable is not set correctly");
  }

  const fileName = `${slideId}.mp3`;
  const audioDir = path.join(process.cwd(), "public", "audio", folderName);
  const filePath = path.join(audioDir, fileName);

  // Ensure the directory exists
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Construct URL with parameters
  const url = new URL(VOICERSS_API_URL);
  url.searchParams.append("key", apiKey);
  url.searchParams.append("src", text);
  url.searchParams.append("hl", LANGUAGE);
  url.searchParams.append("v", VOICE);
  url.searchParams.append("c", CODEC);
  url.searchParams.append("f", FORMAT);

  // Call VoiceRSS API
  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `VoiceRSS API error (${response.status}): ${errorBody}`
    );
  }

  // Check if response is text (error) starting with "ERROR: "
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/plain")) {
     const textResp = await response.text();
     if (textResp.startsWith("ERROR:")) {
         throw new Error(`VoiceRSS API Error: ${textResp}`);
     }
     // If it's text but not an error?? (Unlikely for MP3 request)
  }

  // Save the audio buffer to disk
  const audioBuffer = new Uint8Array(await response.arrayBuffer());
  
  // VoiceRSS returns "ERROR: ..." as the body if something goes wrong even with 200 OK sometimes,
  // but if we requested MP3 and got text, we should check.
  // The check above covers it.

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
    case "quiz":
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
  console.log(`Generating VoiceRSS narration → /audio/${folderName}/`);

  // Process slides sequentially to avoid rate limiting
  // VoiceRSS free tier limit: 350 requests/day. Access rate not strictly defined but sequential is safer.
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
