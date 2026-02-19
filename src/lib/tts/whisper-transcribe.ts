/**
 * Whisper.cpp transcription module for word-level caption timestamps.
 *
 * Flow:
 *   1. Install whisper.cpp binary (cached after first run)
 *   2. Download whisper model (cached after first download)
 *   3. Convert audio to 16kHz WAV (pure Node.js, no ffmpeg needed)
 *   4. Transcribe → word-level timestamps
 *   5. Return Caption[] for use with @remotion/captions
 */
import path from "path";
import fs from "fs";
import type { Caption } from "@remotion/captions";

const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");
const WHISPER_MODEL = "medium.en";
const WHISPER_VERSION = "1.5.5";

let whisperReady = false;

/**
 * Ensures whisper.cpp is installed and the model is downloaded.
 * This is a no-op after the first call (everything is cached on disk).
 */
async function ensureWhisperReady(): Promise<void> {
    if (whisperReady) return;

    const {
        installWhisperCpp,
        downloadWhisperModel,
    } = await import("@remotion/install-whisper-cpp");

    // Install whisper.cpp binary (skip if already present)
    if (!fs.existsSync(path.join(WHISPER_DIR, "main"))) {
        console.log("📦 Installing whisper.cpp (one-time setup)...");
        await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
        console.log("✅ whisper.cpp installed");
    }

    // Download model (skip if already present)
    const modelFile = path.join(WHISPER_DIR, "models", `ggml-${WHISPER_MODEL}.bin`);
    if (!fs.existsSync(modelFile)) {
        console.log(`📦 Downloading whisper model "${WHISPER_MODEL}" (one-time, ~500MB)...`);
        await downloadWhisperModel({ model: WHISPER_MODEL, folder: WHISPER_DIR });
        console.log("✅ Whisper model downloaded");
    }

    whisperReady = true;
}

/**
 * Converts a WAV file to 16kHz mono WAV (required by whisper.cpp).
 * Pure Node.js — no ffmpeg dependency.
 * Uses linear interpolation for resampling.
 */
function convertTo16kHz(inputPath: string): string {
    const dir = path.dirname(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(dir, `${basename}_16k.wav`);

    const inputBuf = fs.readFileSync(inputPath);

    // Parse WAV header
    const numChannels = inputBuf.readUInt16LE(22);
    const srcSampleRate = inputBuf.readUInt32LE(24);
    const bitsPerSample = inputBuf.readUInt16LE(34);
    const bytesPerSample = bitsPerSample / 8;

    // Find "data" chunk (usually at offset 36, but some WAVs have extra chunks)
    let dataOffset = 12; // skip RIFF header
    let dataSize = 0;
    while (dataOffset < inputBuf.length - 8) {
        const chunkId = inputBuf.toString("ascii", dataOffset, dataOffset + 4);
        const chunkSize = inputBuf.readUInt32LE(dataOffset + 4);
        if (chunkId === "data") {
            dataOffset += 8;
            dataSize = chunkSize;
            break;
        }
        dataOffset += 8 + chunkSize;
    }

    if (dataSize === 0) throw new Error("Could not find data chunk in WAV file");

    // Extract PCM samples as Float64 mono
    const totalSamples = dataSize / (bytesPerSample * numChannels);
    const monoSamples = new Float64Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
        let sample = 0;
        for (let ch = 0; ch < numChannels; ch++) {
            const bytePos = dataOffset + (i * numChannels + ch) * bytesPerSample;
            if (bytesPerSample === 2) {
                sample += inputBuf.readInt16LE(bytePos) / 32768;
            } else if (bytesPerSample === 4) {
                sample += inputBuf.readFloatLE(bytePos);
            } else {
                sample += (inputBuf.readUInt8(bytePos) - 128) / 128;
            }
        }
        monoSamples[i] = sample / numChannels; // Average channels
    }

    // Resample to 16kHz using linear interpolation
    const targetRate = 16000;
    const ratio = srcSampleRate / targetRate;
    const outputLength = Math.floor(totalSamples / ratio);
    const resampled = new Int16Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
        const srcPos = i * ratio;
        const idx = Math.floor(srcPos);
        const frac = srcPos - idx;
        const s0 = monoSamples[idx] || 0;
        const s1 = monoSamples[Math.min(idx + 1, totalSamples - 1)] || 0;
        const interpolated = s0 + (s1 - s0) * frac;
        resampled[i] = Math.max(-32768, Math.min(32767, Math.round(interpolated * 32767)));
    }

    // Write 16kHz mono 16-bit WAV
    const outDataSize = resampled.length * 2;
    const outBuf = Buffer.alloc(44 + outDataSize);

    outBuf.write("RIFF", 0);
    outBuf.writeUInt32LE(36 + outDataSize, 4);
    outBuf.write("WAVE", 8);
    outBuf.write("fmt ", 12);
    outBuf.writeUInt32LE(16, 16);
    outBuf.writeUInt16LE(1, 20); // PCM
    outBuf.writeUInt16LE(1, 22); // mono
    outBuf.writeUInt32LE(targetRate, 24);
    outBuf.writeUInt32LE(targetRate * 2, 28); // byte rate
    outBuf.writeUInt16LE(2, 32); // block align
    outBuf.writeUInt16LE(16, 34); // bits per sample
    outBuf.write("data", 36);
    outBuf.writeUInt32LE(outDataSize, 40);

    // Copy PCM data
    const pcmBuf = Buffer.from(resampled.buffer);
    pcmBuf.copy(outBuf, 44);

    fs.writeFileSync(outputPath, outBuf);
    return outputPath;
}

/**
 * Transcribes an audio file and returns word-level Caption[] data.
 *
 * @param audioPath - Absolute path to the WAV file (any sample rate)
 * @returns Caption[] with per-word startMs, endMs, timestampMs
 */
export async function transcribeAudio(audioPath: string): Promise<Caption[]> {
    await ensureWhisperReady();

    const { transcribe, toCaptions } = await import("@remotion/install-whisper-cpp");

    // Convert to 16kHz for whisper
    console.log(`  🎤 Transcribing: ${path.basename(audioPath)}...`);
    const wav16kPath = convertTo16kHz(audioPath);

    try {
        const whisperOutput = await transcribe({
            model: WHISPER_MODEL,
            whisperPath: WHISPER_DIR,
            whisperCppVersion: WHISPER_VERSION,
            inputPath: wav16kPath,
            tokenLevelTimestamps: true,
        });

        // Convert whisper output to Caption[] format
        const { captions } = toCaptions({ whisperCppOutput: whisperOutput });

        console.log(`  ✅ Transcription complete: ${captions.length} caption tokens`);
        return captions;
    } finally {
        // Clean up the 16kHz temp file
        if (fs.existsSync(wav16kPath)) {
            fs.unlinkSync(wav16kPath);
        }
    }
}
