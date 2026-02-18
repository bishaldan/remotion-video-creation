
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
    const apiKey = process.env.TYPECAST_API_KEY;
    console.log("Checking API Key:", apiKey ? "EXISTS" : "MISSING");
    if (!apiKey) return;

    try {
        const response = await fetch("https://api.typecast.ai/v2/voices", {
            method: "GET",
            headers: { "X-API-KEY": apiKey },
        });
        console.log("Voices API Response Status:", response.status);

        console.log("Attempting actual TTS generation...");
        const ttsResponse = await fetch("https://api.typecast.ai/v1/text-to-speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey
            },
            body: JSON.stringify({
                voice_id: "tc_6837b58f80ceeb17115bb771",
                text: "Hello, this is a test.",
                model: "ssfm-v30",
                language: "eng",
                output: { audio_format: "wav" }
            }),
        });
        console.log("TTS Response Status:", ttsResponse.status);
        if (!ttsResponse.ok) {
            console.log("TTS Error Body:", await ttsResponse.text());
        } else {
            console.log("TTS SUCCESS! (Buffer length:", (await ttsResponse.arrayBuffer()).byteLength, ")");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
test();
