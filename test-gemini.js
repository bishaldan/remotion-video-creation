
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  // Note: The Node.js SDK doesn't expose listModels directly on the main class in some versions,
  // or it might be needed to use the model manager if available.
  // However, `getGenerativeModel` is the standard way.
  // We can try to just use a known stable model if listModels isn't easily accessible via this SDK version.
  // Let's try to query a very stable model like 'gemini-pro' first to see if the key works at all.
  
  try {
      // There isn't a direct listModels in the high-level SDK often.
      // But we can try to hit the API manually if needed, or just test a different model name.
      console.log("Checking API key with 'gemini-1.5-flash'...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hello");
      console.log("Success with gemini-1.5-flash: ", result.response.text());
  } catch (error) {
      console.error("Error with gemini-1.5-flash:", error.message);
  }

  try {
      console.log("Checking API key with 'gemini-1.0-pro'...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
      const result = await model.generateContent("Hello");
      console.log("Success with gemini-1.0-pro: ", result.response.text());
  } catch (error) {
      console.error("Error with gemini-1.0-pro:", error.message);
  }
}

listModels();
