/**
 * Test script for Kokoro TTS Parameters (via Hugging Face Inference SDK)
 * 
 * Usage: node test-kokoro-params.js
 * 
 * Requires HF_TOKEN in .env.local
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  console.error('❌ HF_TOKEN not found in .env.local');
  process.exit(1);
}

async function generateAudio(client, text, filePath, options = {}) {
  console.log(`Generating with options: ${JSON.stringify(options)}`);
  try {
    const audio = await client.textToSpeech({
      provider: "replicate",
      model: "hexgrad/Kokoro-82M",
      inputs: text,
      parameters: options 
    });

    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✓ ${path.basename(filePath)} (${buffer.length} bytes)`);
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
  }
}

async function main() {
  const { InferenceClient } = await import('@huggingface/inference');
  const client = new InferenceClient(HF_TOKEN);

  console.log('🎤 Kokoro TTS Parameter Test\n');
  const outputDir = path.join(__dirname, 'test-audio');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const text = "This is a test of the Kokoro text to speech system.";

  // Test 1: Default
  await generateAudio(client, text, path.join(outputDir, 'default.wav'));

  // Test 2: Slow Speed
  await generateAudio(client, text, path.join(outputDir, 'slow.wav'), { speed: 0.8 });

   // Test 3: Fast Speed
   await generateAudio(client, text, path.join(outputDir, 'fast.wav'), { speed: 1.2 });

  // Test 4: Voice (assuming generic 'af' works based on common Kokoro usage)
  await generateAudio(client, text, path.join(outputDir, 'voice-af.wav'), { voice: 'af' });

  // Test 5: Voice (assuming generic 'am' works)
  await generateAudio(client, text, path.join(outputDir, 'voice-am.wav'), { voice: 'am' });
}

main();
