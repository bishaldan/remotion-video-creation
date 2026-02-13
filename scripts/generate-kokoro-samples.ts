import fs from "fs";
import { KokoroTTS } from "kokoro-js";
import path from "path";
import { KOKORO_VOICES } from "../src/lib/tts/kokoro-tts";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

async function generateSamples() {
  console.log("Initializing Kokoro TTS...");
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: "fp32",
  });

  const outputDir = path.join(process.cwd(), "public", "audio", "kokoro");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating samples for ${Object.keys(KOKORO_VOICES).length} voices...`);

  for (const [voiceId, details] of Object.entries(KOKORO_VOICES)) {
    const text = `Hey, this is ${details.name}. I am a ${details.gender} voice with an ${details.accent} accent.`;
    const fileName = `${voiceId}_${details.gender}_${details.accent}.wav`.toLowerCase();
    const filePath = path.join(outputDir, fileName);

    // Skip if already exists to save time/resources, or remove this check to regenerate
    if (fs.existsSync(filePath)) {
        console.log(`  ⚠ Skipping ${voiceId} (already exists)`);
        continue;
    }

    try {
      console.log(`  Generating ${voiceId}...`);
      const audio = await tts.generate(text, {
        voice: voiceId as any,
      });
      await audio.save(filePath);
      console.log(`  ✓ Saved: ${fileName}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${voiceId}:`, error);
    }
  }

  console.log("\nDone! Samples saved to public/audio/kokoro/");
}

generateSamples().catch(console.error);
