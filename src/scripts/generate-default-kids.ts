
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

console.log('Unsplash Key Present:', !!process.env.UNSPLASH_ACCESS_KEY);
if (process.env.UNSPLASH_ACCESS_KEY) {
    console.log('Unsplash Key (first 4 chars):', process.env.UNSPLASH_ACCESS_KEY.substring(0, 4));
} else {
    console.error('⚠️ UNSPLASH_ACCESS_KEY is missing! Exiting.');
    process.exit(1);
}

import { defaultKidsTimeline, KidsTimeline } from '../../types/edu-kids';
import { setImagesUrl } from '../lib/image/unsplash';
import { setNarrationUrls as setKokoroNarrationUrls } from '../lib/tts/kokoro-tts';
import fs from 'fs/promises';

async function generateDefaultKidsContent() {
    console.log('🚀 Starting default kids content generation...');

    // 1. Clone the default timeline to avoid mutating the original
    const timeline: KidsTimeline = JSON.parse(JSON.stringify(defaultKidsTimeline));

    console.log('📝 Timeline:', timeline.title);

    // 2. Set Images (using the updated logic in unsplash.ts)
    console.log('🖼️ Fetching images...');
    try {
        // Force portrait orientation for kids content as per requirement
        await setImagesUrl(timeline, 'portrait');
        console.log('✅ Images fetched successfully.');
    } catch (error) {
        console.error('❌ Error fetching images:', error);
    }

    // 3. Set Narration (TTS)
    console.log('🗣️ Generating narration...');
    try {
        // Use a default voice ID (e.g., 'af_sarah' or whatever is default)
        // The setKokoroNarrationUrls function signature: (timeline, prompt, mode, voiceId)
        // We'll use "Default Kids Content" as the prompt since it's used for file naming/metadata
        await setKokoroNarrationUrls(timeline, "Default Kids Content", "educationKids", "am_santa");
        console.log('✅ Narration generated successfully.');
    } catch (error) {
        console.error('❌ Error generating narration:', error);
    }

    // 4. Output the result
    const outputPath = path.resolve(process.cwd(), 'default-kids-timeline.json');
    await fs.writeFile(outputPath, JSON.stringify(timeline, null, 2));

    console.log(`\n✨ Generation complete!`);
    console.log(`📂 Output saved to: ${outputPath}`);
    console.log(`\nYou can now copy the contents of this file and use it in your application, or create a mechanism to load it directly.`);
}

generateDefaultKidsContent().catch(console.error);
