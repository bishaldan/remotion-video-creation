const { getAudioUrl } = require("google-tts-api");
const fs = require("fs");
const path = require("path");
const https = require("https");

// --- 1. Define Default Data (Extracted from types/edu.ts and types/quiz.ts) ---

const defaultEduCompProps = {
  title: "Educational Video",
  slides: [
    { type: "intro", title: "The Wonder of Learning", subtitle: "Exploring New Horizons with AI" },
    { type: "lottie", title: "Let's Learn Something New!", text: "This video uses AI-generated content with animated characters." },
    { type: "bullets", title: "What You'll Learn", bullets: ["Create animated presentations", "Use dynamic templates", "Generate videos from prompts", "Add images and Lottie animations"] },
    { type: "image", caption: "Powered by AI and beautiful visuals", imageQuery: "technology" },
    { type: "outro", title: "Thanks for Watching!", callToAction: "Created with Remotion SaaS" }
  ]
};

const defaultDualQuizTimeline = {
  title: "Solar System Quiz",
  slides: [
    { type: "intro", title: "Solar System Quiz", subtitle: "Test your knowledge!" },
    { type: "quiz", question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"] },
    { type: "quiz", question: "What is the largest planet in our solar system?", options: ["Earth", "Jupiter", "Uranus", "Neptune"] },
    { type: "outro", title: "Great Job!", callToAction: "Follow for more quizzes" }
  ]
};

const defaultSingleQuizTimeline = {
  title: "General Knowledge Quiz",
  slides: [
    { type: "intro", title: "General Knowledge Quiz", subtitle: "How much do you know?" },
    { type: "singleQuiz", question: "What is the outer layer of a tooth called?", options: ["Dentin", "Enamel", "Pulp", "Cementum"] },
    { type: "singleQuiz", question: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Mars", "Earth"] },
    { type: "outro", title: "Great Job!", callToAction: "How many did you get right?" }
  ]
};

// --- 2. Helper Functions ---

function getNarrationText(slide) {
  switch (slide.type) {
    case "intro":
      return `${slide.title}. ${slide.subtitle || ""}`;
    case "text":
      return slide.text;
    case "bullets":
      return `${slide.title ? slide.title + ". " : ""}${slide.bullets.join(". ")}`;
    case "diagram":
      return `${slide.title ? slide.title + ". " : ""}This diagram shows: ${slide.nodes.map(n => n.label).join(", ")}`;
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

async function generateTTS(text, filename) {
  if (!text) return null;
  
  console.log(`Generating TTS for: "${text.substring(0, 30)}..."`);
  
  try {
    const url = getAudioUrl(text, {
      lang: "en",
      slow: false,
      host: "https://translate.google.com",
    });
    
    const audioDir = path.join(process.cwd(), "public", "audio");
    const filePath = path.join(audioDir, filename);

    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      https.get(url, function(response) {
        if (response.statusCode !== 200) {
          reject(new Error(`Status Code: ${response.statusCode}`));
          return;
        }
        
        const file = fs.createWriteStream(filePath);
        response.pipe(file);
        
        file.on('finish', function() {
          file.close();
          resolve(`/audio/${filename}`);
        });
      }).on('error', function(err) {
        fs.unlink(filePath, () => {}); 
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error generating TTS:", error.message);
    return null;
  }
}

// --- 3. Main Test Function ---

async function runTest() {
  console.log("Starting Bulk TTS Generation Test...\n");

  const suites = [
    { name: "Education", data: defaultEduCompProps },
    { name: "Dual Quiz", data: defaultDualQuizTimeline },
    { name: "Single Quiz", data: defaultSingleQuizTimeline }
  ];

  for (const suite of suites) {
    console.log(`\n--- Processing ${suite.name} Template ---`);
    
    for (const [index, slide] of suite.data.slides.entries()) {
      const text = getNarrationText(slide);
      const filename = `test-${suite.name.toLowerCase().replace(/\s/g, '-')}-slide-${index}.mp3`;
      
      try {
        const result = await generateTTS(text, filename);
        if (result) {
          console.log(`✅ Slide ${index}: Saved to ${result}`);
        } else {
          console.log(`⚠️ Slide ${index}: No text to generate`);
        }
      } catch (err) {
        console.error(`❌ Slide ${index} Failed:`, err.message);
      }
    }
  }
  
  console.log("\nTest Complete!");
}

runTest();
