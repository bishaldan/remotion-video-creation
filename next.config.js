/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "esbuild",
    "kokoro-js",
    "onnxruntime-node",
    "phonemizer",
    "@huggingface/transformers",
  ],
};

module.exports = nextConfig;

