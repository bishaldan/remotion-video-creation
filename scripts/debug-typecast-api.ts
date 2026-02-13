import dotenv from "dotenv";
import "dotenv/config";
import path from "path";

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const API_URL_V1 = "https://api.typecast.ai/v1/text-to-speech";
const API_KEY = process.env.TYPECAST_API_KEY;
const VOICE_ID = "tc_6791c4a4c79515dea68b4a75"; // Logan

async function testPayload(label: string, promptObject: any) {
    console.log(`\n--- Testing [${label}]: ${JSON.stringify(promptObject)} ---`);
    
    const body = {
        voice_id: VOICE_ID,
        text: "Hello testing.",
        model: "ssfm-v30",
        language: "eng",
        prompt: promptObject,
        output: {
            audio_format: "wav",
            audio_tempo: 1.0,
        },
    };

    try {
        const response = await fetch(API_URL_V1, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": API_KEY!, 
            },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            console.log("✅ SUCCESS! Status:", response.status);
        } else {
            const errorText = await response.text();
            console.log("❌ FAILED. Status:", response.status);
            console.log("Error Body:", errorText);
        }
    } catch (error) {
        console.error("❌ CRTICAL ERROR:", error);
    }
}

async function main() {
    if (!API_KEY) {
        console.error("Missing API KEY");
        return;
    }

    // 1. Preset sibling string
    await testPayload("Preset Sibling String", { emotion_type: "preset", preset: "normal" });

    // 2. Preset sibling int (just in case)
    await testPayload("Preset Sibling Int", { emotion_type: "preset", preset: 1 });

    // 3. emotion_preset
    await testPayload("emotion_preset", { emotion_type: "preset", emotion_preset: "normal" });

    // 4. tone_preset
    await testPayload("tone_preset", { emotion_type: "preset", tone_preset: "normal" });

    // 5. control
    await testPayload("control", { emotion_type: "preset", control: "normal" });

    // 6. args
    await testPayload("args", { emotion_type: "preset", args: { preset: "normal" } });
    
    // 7. params
    await testPayload("params", { emotion_type: "preset", params: { preset: "normal" } });
}

main();
