import dotenv from "dotenv";
import path from "path";
import { fetchAvailableVoices } from "../src/lib/tts/typecastAi-tts";

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
    try {
        console.log("Fetching Typecast voices...");
        const voices = await fetchAvailableVoices();
        
        console.log(`Found ${voices.length} voices.`);
        
        // Log the first voice to see the structure
        if (voices.length > 0) {
            console.log("Sample voice structure:", JSON.stringify(voices[0], null, 2));
        }

        // Typecast API v2 seems to return English voices by default or mixed. 
        // The sample didn't show a 'language' field, so we might have to assume they are mostly English or check 'locale' if available.
        // Let's print the first 20 voices to see variety.
        
        console.log(`\n--- First 30 Available Voices ---`);
        voices.slice(0, 30).forEach((v: any) => {
            const name = v.voice_name || v.name || "Unknown";
            const gender = v.gender || "Unknown";
            // Get models
            const models = v.models ? v.models.map((m: any) => m.version).join(", ") : "Unknown";
            console.log(`ID: ${v.voice_id.padEnd(30)} | Name: ${name.padEnd(15)} | Gender: ${gender.padEnd(8)} | Models: ${models}`);
        });

    } catch (error) {
        console.error("Error fetching voices:", error);
    }
}

main();
