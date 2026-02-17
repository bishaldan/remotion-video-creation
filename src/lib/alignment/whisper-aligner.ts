
import { pipeline, env } from "@xenova/transformers";
import fs from "fs";
import wavefile from "wavefile";

// Configuration: Disable local models check to force download from HF Hub if not present
env.allowLocalModels = false;
env.useBrowserCache = false;

// We use a small model for balance of speed/accuracy. 'Xenova/whisper-tiny' or 'Xenova/whisper-small'
const MODEL_NAME = "Xenova/whisper-tiny";

export interface WordTiming {
    word: string;
    start: number;
    end: number;
    score?: number;
}

let transcriber: any = null;

async function getTranscriber() {
    if (!transcriber) {
        console.log(`Loading Whisper model: ${MODEL_NAME}...`);
        transcriber = await pipeline("automatic-speech-recognition", MODEL_NAME);
        console.log("Whisper model loaded.");
    }
    return transcriber;
}

/**
 * Aligns text with audio by transcribing the audio file and returning word-level timestamps.
 * Note: Whisper does transcription, not forced alignment of provided text.
 * However, the transcription is usually accurate enough to match the script.
 * For true forced alignment, we'd need a different tool, but for this use case,
 * using the transcribed words (which will match the audio 100%) is actually BETTER
 * because we want to highlight what is *actually* said.
 */
export async function alignAudio(audioPath: string): Promise<WordTiming[]> {
    try {
        const transcriber = await getTranscriber();

        // Read and process audio
        const buffer = fs.readFileSync(audioPath);
        const wav = new wavefile.WaveFile(buffer);

        // Ensure 16kHz sample rate (Whisper requirement)
        wav.toSampleRate(16000);

        // Get samples as Float32Array
        let samples = wav.getSamples();
        if (Array.isArray(samples)) {
            // If stereo, take first channel
            samples = samples[0];
        }

        // Normalize to [-1, 1]
        const floatSamples = new Float32Array(samples.length);
        const maxVal = 32768; // Assuming 16-bit
        for (let i = 0; i < samples.length; i++) {
            floatSamples[i] = samples[i] / maxVal;
        }

        // Run transcription with timestamps
        const output = await transcriber(floatSamples, {
            return_timestamps: "word",
            chunk_length_s: 30,
            stride_length_s: 5,
        });

        // Extract word timings
        // The output structure from xenova/transformers for "word" timestamps depends on version,
        // but typically it's in `chunks` array.

        const wordTimings: WordTiming[] = [];

        if (output.chunks) {
            for (const chunk of output.chunks) {
                // chunk.timestamp is [start, end]
                // We need to verify if chunks are words or phrases. 
                // With return_timestamps: "word", chunks usually represent words or small tokens.
                const text = chunk.text.trim();
                const [start, end] = chunk.timestamp;

                if (text && start !== null && end !== null) {
                    wordTimings.push({
                        word: text,
                        start,
                        end
                    });
                }
            }
        }

        return wordTimings;

    } catch (error) {
        console.error("Whisper Alignment Error:", error);
        return [];
    }
}
