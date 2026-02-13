/**
 * Generate synthetic sound effects for quiz slides:
 * - tick.wav: Short click/tick sound for countdown
 * - ting.wav: Pleasant chime for correct answer reveal
 *
 * Run: node scripts/generate-sfx.js
 */

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;

// ── WAV file writer ──────────────────────────────────────────────
function writeWav(filePath, samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const byteRate = sampleRate * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  console.log(`  ✓ ${path.basename(filePath)} (${numSamples} samples, ${(numSamples / sampleRate).toFixed(2)}s)`);
}

// ── Tick sound: sharp, short click ───────────────────────────────
function generateTick() {
  const duration = 0.08; // 80ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Sharp attack with fast exponential decay
    const envelope = Math.exp(-t * 80);
    // Mix of high frequencies for a crisp "tick"
    const signal =
      0.6 * Math.sin(2 * Math.PI * 800 * t) +
      0.3 * Math.sin(2 * Math.PI * 1600 * t) +
      0.1 * Math.sin(2 * Math.PI * 3200 * t);
    samples[i] = signal * envelope * 0.7;
  }

  return samples;
}

// ── Ting sound: pleasant bell chime ──────────────────────────────
function generateTing() {
  const duration = 0.8; // 800ms
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Bell-like envelope: fast attack, slow decay
    const envelope = Math.exp(-t * 4) * (1 - Math.exp(-t * 500));
    // Bell harmonics (fundamental + partials)
    const signal =
      0.5 * Math.sin(2 * Math.PI * 1200 * t) +  // fundamental
      0.25 * Math.sin(2 * Math.PI * 2400 * t) +  // 2nd harmonic
      0.15 * Math.sin(2 * Math.PI * 3600 * t) +  // 3rd harmonic
      0.1 * Math.sin(2 * Math.PI * 4800 * t);    // 4th harmonic
    samples[i] = signal * envelope * 0.8;
  }

  return samples;
}

// ── Main ─────────────────────────────────────────────────────────
const outDir = path.join(__dirname, "..", "public", "audio", "sfx");
console.log("Generating quiz sound effects...");

writeWav(path.join(outDir, "tick.wav"), generateTick());
writeWav(path.join(outDir, "ting.wav"), generateTing());

console.log(`\nDone! Files saved to: ${outDir}`);
