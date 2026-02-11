/**
 * Test script for ElevenLabs TTS
 * 
 * Usage: node test-elevenlabs-tts.js
 * 
 * Requires ELEVENLABS_API_KEY in .env.local
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

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_128';
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`;

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in .env.local');
  console.error('   Add it: ELEVENLABS_API_KEY=your_key_here');
  process.exit(1);
}

function sanitize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

async function generateAudio(text, filePath) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
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
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  console.log(`  ✓ ${path.basename(filePath)} (${buffer.length} bytes)`);
}

// ── Default Props Data ──────────────────────────────────────────

const educationSlides = [
  { type: 'intro', text: 'The Wonder of Learning. Exploring New Horizons with AI' },
  { type: 'lottie', text: 'This video uses AI-generated content with animated characters to make learning fun and engaging.' },
  { type: 'bullets', text: 'What You\'ll Learn. Create animated presentations with rich visuals. Use dynamic templates with transitions. Generate videos from prompts using AI. Add images and Lottie animations.' },
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

async function generateForTemplate(templateName, mode, slides) {
  const date = new Date().toISOString().split('T')[0];
  const folderName = `${sanitize(templateName)}_${mode}_${date}`;
  const audioDir = path.join(__dirname, 'public', 'audio', folderName);
  
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  console.log(`\n📁 ${folderName}/`);
  
  for (let i = 0; i < slides.length; i++) {
    const filePath = path.join(audioDir, `slide-${i}.mp3`);
    await generateAudio(slides[i].text, filePath);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  return folderName;
}

async function main() {
  console.log('🎤 ElevenLabs TTS Test\n');
  console.log(`Voice: Rachel (${VOICE_ID})`);
  console.log(`Model: ${MODEL_ID}\n`);

  try {
    // Generate for each template
    const eduFolder = await generateForTemplate('The Wonder of Learning', 'education', educationSlides);
    const dualFolder = await generateForTemplate('General Knowledge Quiz', 'quiz', dualQuizSlides);
    const singleFolder = await generateForTemplate('Science Quiz', 'singleQuiz', singleQuizSlides);

    console.log('\n✅ All audio generated successfully!');
    console.log('\nGenerated folders:');
    console.log(`  public/audio/${eduFolder}/`);
    console.log(`  public/audio/${dualFolder}/`);
    console.log(`  public/audio/${singleFolder}/`);

    // Print commands to update default props
    console.log('\n📝 Update narrationUrl in default props to:');
    console.log(`  Education: /audio/${eduFolder}/slide-{i}.mp3`);
    console.log(`  Dual Quiz: /audio/${dualFolder}/slide-{i}.mp3`);
    console.log(`  Single Quiz: /audio/${singleFolder}/slide-{i}.mp3`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
