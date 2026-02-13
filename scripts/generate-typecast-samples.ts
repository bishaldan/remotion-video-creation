import dotenv from "dotenv";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { generateTTS, TYPECAST_VOICES } from "../src/lib/tts/typecastAi-tts";

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function generateTypecastSamples() {
    const outputDir = path.join(process.cwd(), "public", "audio", "typecast");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("Initializing Typecast Sample Generation...");
    console.log(`Output Directory: ${outputDir}`);

    let count = 0;
    const voiceIds = Object.keys(TYPECAST_VOICES);

    console.log(`Generatign samples for ${voiceIds.length} voices...`);

    for (const [voiceId, details] of Object.entries(TYPECAST_VOICES)) {
        const text = `Hey there! This is ${details.name}. I am a ${details.description.toLowerCase()}.`;
        
        // Naming convention: [name]_[gender].wav (simplified for easy matching)
        // Or better: [voiceId].wav to match selection
        // Let's use [voiceId].wav as it's unique and safer
        const fileName = `${voiceId}`; // generateTTS adds .wav extension and folder path logic

        // We need to bypass the standard folder logic which creates a date-stamped folder.
        // We want specifically in `public/audio/typecast/`.
        // The existing generateTTS puts it in `public/audio/[folderName]/[slideId].wav`
        // We can utilize that by passing `typecast` as folderName and `${voiceId}` as slideId.
        
        const filePath = path.join(outputDir, `${fileName}.wav`);
        
        if (fs.existsSync(filePath)) {
            console.log(`  ⚠ Skipping ${details.name} (File exists)`);
            continue;
        }

        console.log(`  Generating ${details.name}...`);
        
        try {
            await generateTTS(
                text, 
                fileName, // slideId -> filename
                "typecast", // folderName
                { voiceId: voiceId, emotion: "normal" }
            );
            count++;
            // Typecast might rate limit, so let's pause a bit
            await new Promise(r => setTimeout(r, 1000));
        } catch (error) {
             console.error(`  ❌ Failed to generate ${details.name}:`, error);
        }
    }

    console.log(`\nDone! Generated ${count} new samples in public/audio/typecast/`);
}

generateTypecastSamples();
