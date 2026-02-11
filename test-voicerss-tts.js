/**
 * Test script for VoiceRSS TTS
 * 
 * Usage: node test-voicerss-tts.js
 * 
 * Requires VOICERSS_API_KEY in .env.local
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

const API_KEY = process.env.VOICERSS_API_KEY;
const LANGUAGE = 'en-us';
const VOICE = 'Amy';
const CODEC = 'MP3';
const FORMAT = '44khz_16bit_stereo';
const API_URL = 'http://api.voicerss.org/';

if (!API_KEY || API_KEY === 'your_key_here') {
  console.error('❌ VOICERSS_API_KEY not found or invalid in .env.local');
  console.error('   Add it: VOICERSS_API_KEY=your_key_here');
  process.exit(1);
}

function sanitize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

async function generateAudio(text, filePath) {
  const url = new URL(API_URL);
  url.searchParams.append('key', API_KEY);
  url.searchParams.append('src', text);
  url.searchParams.append('hl', LANGUAGE);
  url.searchParams.append('v', VOICE);
  url.searchParams.append('c', CODEC);
  url.searchParams.append('f', FORMAT);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`VoiceRSS API error (${response.status}): ${error}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  
  // Check for text error response
  if (buffer.length < 1000) { // Simple check for potential text error
      const textResp = buffer.toString('utf-8');
      if (textResp.startsWith('ERROR:')) {
          throw new Error(`VoiceRSS API Error: ${textResp}`);
      }
  }

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
    try {
        await generateAudio(slides[i].text, filePath);
    } catch (e) {
        console.error(`  ❌ Failed slide ${i}: ${e.message}`);
    }
    // Rate limit precaution
    await new Promise(r => setTimeout(r, 1000));
  }

  return folderName;
}

async function main() {
  console.log('🎤 VoiceRSS TTS Test\n');
  console.log(`Voice: ${VOICE} (${LANGUAGE})`);
  console.log(`Format: ${FORMAT}\n`);

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
