/**
 * Test script for Kokoro TTS (via Hugging Face Inference SDK)
 * 
 * Usage: node test-kokoro-tts.js
 * 
 * Requires HF_TOKEN in .env.local
 */

const fs = require('fs');
const path = require('path');



function sanitize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

// ── Default Props Data ──────────────────────────────────────────

const educationSlides = [
  { type: 'intro', text: 'The Wonder of Learning. Exploring New Horizons with AI' },
  { type: 'lottie', text: 'This video uses AI-generated content with animated characters to make learning fun and engaging.' },
  { type: 'bullets', text: "What You'll Learn. Create animated presentations with rich visuals. Use dynamic templates with transitions. Generate videos from prompts using AI. Add images and Lottie animations." },
  { type: 'image', text: 'Powered by AI and beautiful visuals' },
  { type: 'outro', text: 'Thanks for Watching! Created with Remotion SaaS' },
];

const dualQuizSlides = [
  { type: 'quiz', text: 'What is the capital of France? Is it: London, or Paris, or Berlin, or Madrid?' },
  { type: 'quiz', text: 'Which planet is known as the Red Planet? Is it: Venus, or Mars, or Jupiter, or Saturn?' },
  { type: 'quiz', text: 'What is H2O commonly known as? Is it: Oxygen, or Hydrogen, or Water, or Carbon?' },
  { type: 'quiz', text: 'Who painted the Mona Lisa? Is it: Van Gogh, or Da Vinci, or Picasso, or Monet?' },
];

const singleQuizSlides = [
  { type: 'singleQuiz', text: 'What is the largest ocean on Earth? Is it: Atlantic, or Pacific, or Indian, or Arctic?' },
  { type: 'singleQuiz', text: 'What gas do plants absorb from the atmosphere? Is it: Oxygen, or Nitrogen, or Carbon Dioxide, or Hydrogen?' },
  { type: 'singleQuiz', text: 'How many continents are there? Is it: 5, or 6, or 7, or 8?' },
  { type: 'singleQuiz', text: 'What is the speed of light? Is it: 300km/s, or 300,000 km/s, or 3,000 km/s, or 30,000 km/s?' },
];

async function generateForTemplate(templateName, mode, slides, options = {}) {
  const date = new Date().toISOString().split('T')[0];
  const folderName = `kokoro-${sanitize(templateName)}_${mode}_${date}`;
  const audioDir = path.join(__dirname, 'public', 'audio', folderName);
  
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  console.log(`\n📁 ${folderName}/ (Options: ${JSON.stringify(options)})`);
  
  for (let i = 0; i < slides.length; i++) {
    const filePath = path.join(audioDir, `slide-${i}.wav`);
    try {
        await generateAudio(model, slides[i].text, filePath, options);
    } catch (e) {
        console.error(`  ❌ Failed slide ${i}: ${e.message}`);
    }
    // Rate limit not needed as much for local, but good to prevent freezing
    await new Promise(r => setTimeout(r, 100));
  }

  return folderName;
}

const { KokoroTTS } = require("kokoro-js");

// Global model
let model;

async function generateAudio(model, text, filePath, options = {}) {
  const audio = await model.generate(text, {
    voice: options.voice || "af_bella",
    speed: options.speed || 1.0,
  });

  await audio.save(filePath);
  console.log(`  ✓ ${path.basename(filePath)}`);
}

async function main() {
  console.log('🎤 Kokoro TTS Test (Local via kokoro-js)\n');
  console.log('Model: onnx-community/Kokoro-82M-v1.0-ONNX\n');

  try {
    // Load model once
    model = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
        dtype: "fp32",
    });
    console.log("✅ Model loaded.\n");

    // Generate for each template
    const eduFolder = await generateForTemplate('The Wonder of Learning', 'education', educationSlides);
    
    // Example: Generating with custom speed and voice
    // console.log('\n🎤 Generating Fast (1.2x) Narration...');
    // const fastFolder = await generateForTemplate('Fast Narration', 'education-fast', [educationSlides[0]], { speed: 1.2 });

    // Generating quiz audio (default props)
    const dualFolder = await generateForTemplate('General Knowledge Quiz', 'quiz', dualQuizSlides);
    const singleFolder = await generateForTemplate('Science Quiz', 'singleQuiz', singleQuizSlides);

    console.log('\n✅ Kokoro TTS test complete!');
    console.log(`Audio saved to:`);
    console.log(`  Education: public/audio/${eduFolder}/`);
    console.log(`  Dual Quiz: public/audio/${dualFolder}/`);
    console.log(`  Single Quiz: public/audio/${singleFolder}/`);
    
    // Print update instructions
    console.log('\n📝 Updated narrationUrl in default props to:');
    console.log(`  Education: /audio/${eduFolder}/slide-{i}.wav`);
    console.log(`  Dual Quiz: /audio/${dualFolder}/slide-{i}.wav`);
    console.log(`  Single Quiz: /audio/${singleFolder}/slide-{i}.wav`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
