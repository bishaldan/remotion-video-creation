import fs from "fs";
import { getAudioUrl } from "google-tts-api";
import https from "https";
import path from "path";

/**
 * Generates an audio file from text using Google Translate TTS (Free).
 * Returns the public URL of the generated audio file.
 */
export async function generateTTS(text: string, slideId: string): Promise<string> {
  // Generate the Google TTS URL
  const url = getAudioUrl(text, {
    lang: "en",
    slow: false,
    host: "https://translate.google.com",
  });

  const fileName = `narration-${slideId}-${Date.now()}.mp3`;
  const audioDir = path.join(process.cwd(), "public", "audio");
  const filePath = path.join(audioDir, fileName);
  
  // Ensure the directory exists
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Download and save the audio file
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download audio: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        resolve(`/audio/${fileName}`);
      });

      fileStream.on("error", (err) => {
        fs.unlink(filePath, () => {}); // cleanup
        reject(err);
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
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
 */
export async function setNarrationUrls(timeline: any) {
  console.log("Generating narration for slides...");
  
  const promises = timeline.slides.map(async (slide: any, index: number) => {
    const text = getNarrationText(slide);
    if (text) {
      try {
        const narrationUrl = await generateTTS(text, `slide-${index}`);
        slide.narrationUrl = narrationUrl;
      } catch (error) {
        console.error(`Failed to generate TTS for slide ${index}:`, error);
      }
    }
  });

  await Promise.all(promises);
}
