import { GoogleGenerativeAI } from "@google/generative-ai";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Timeline } from "../../../../types/edu";
import { KidsTimeline } from "../../../../types/edu-kids";
import { DualQuizTimeline, SingleQuizTimeline } from "../../../../types/quiz";
import {
    EDUCATION_SYSTEM_PROMPT,
    EDUCATION_KIDS_SYSTEM_PROMPT,
    QUIZ_SYSTEM_PROMPT,
    SINGLE_QUIZ_SYSTEM_PROMPT,
} from "../../../lib/prompt/prompts";
import { buildGeneratePrompt } from "../../../lib/prompt/prompt-builder";
import { setNarrationUrls as setKokoroNarrationUrls } from "../../../lib/tts/kokoro-tts";
import { setNarrationUrls as setTypecastNarrationUrls } from "../../../lib/tts/typecastAi-tts";
import { setImagesUrl } from "../../../lib/image/unsplash";
import { cleanJsonResponse } from "../../../lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = "normal" | "educationKids" | "dualQuiz" | "singleQuiz";
type Orientation = "landscape" | "portrait";
type VoiceType = "kokoro" | "typecast";

interface AutomateBody {
    prompt: string;
    mode?: Mode;
    orientation?: Orientation;
    voiceType?: VoiceType;
    voiceId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<Mode, string> = {
    normal: EDUCATION_SYSTEM_PROMPT,
    educationKids: EDUCATION_KIDS_SYSTEM_PROMPT,
    dualQuiz: QUIZ_SYSTEM_PROMPT,
    singleQuiz: SINGLE_QUIZ_SYSTEM_PROMPT,
};

/** Map mode + orientation to the Remotion composition ID registered in Root.tsx */
function getCompositionId(mode: Mode, orientation: Orientation): string {
    switch (mode) {
        case "educationKids":
            return "EducationKidsVideo";
        case "dualQuiz":
            return orientation === "portrait" ? "QuizVideoPortrait" : "QuizVideoLandscape";
        case "singleQuiz":
            return "SingleQuizVideo";
        default:
            return "EducationalVideo";
    }
}

// ─── POST /api/automate ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" }, { status: 500 });
    }

    let outputPath: string | undefined;

    try {
        // ── 1. Parse request ────────────────────────────────────────────────────
        const body: AutomateBody = await request.json();
        const {
            prompt: userPrompt,
            mode = "normal",
            orientation = "landscape",
            voiceType = "kokoro",
            voiceId = "am_santa",
        } = body;

        if (!userPrompt || typeof userPrompt !== "string") {
            return NextResponse.json({ error: "prompt is required" }, { status: 400 });
        }

        console.log(`🤖 [automate] Starting: mode=${mode}, orientation=${orientation}, voice=${voiceType}/${voiceId}`);

        // ── 2. Generate timeline via Gemini AI ──────────────────────────────────
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const systemPrompt = SYSTEM_PROMPTS[mode];

        // Build the full prompt (same enrichment logic as /api/generate)
        let fullPrompt = buildGeneratePrompt({ userPrompt });
        if (mode === "dualQuiz") fullPrompt = `Create a quiz video about: ${userPrompt}. ${fullPrompt}`;
        if (mode === "singleQuiz") fullPrompt = `Create a general knowledge quiz about: ${userPrompt}. ${fullPrompt}`;
        if (mode === "educationKids") fullPrompt = `Create a fun, kid-friendly educational video about: ${userPrompt}. ${fullPrompt}`;

        console.log("🤖 [automate] Generating content with Gemini…");
        const result = await model.generateContent([systemPrompt, fullPrompt]);
        const text = (await result.response).text();
        const cleanedText = cleanJsonResponse(text);

        let timeline: Timeline | DualQuizTimeline | SingleQuizTimeline | KidsTimeline;
        try {
            timeline = JSON.parse(cleanedText);
        } catch {
            console.error("🤖 [automate] JSON parse error:", text.slice(0, 500));
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        // Set mode/orientation on the timeline object
        if (mode === "educationKids") (timeline as any).mode = "educationKids";
        if (mode === "dualQuiz") {
            (timeline as any).mode = "dualQuiz";
            (timeline as any).orientation = orientation;
        }
        if (mode === "singleQuiz") (timeline as any).mode = "singleQuiz";

        // ── 3. Enrich: images + TTS ─────────────────────────────────────────────
        console.log("🤖 [automate] Setting images…");
        await setImagesUrl(timeline, orientation);

        console.log("🤖 [automate] Generating TTS…");
        if (voiceType === "typecast") {
            await setTypecastNarrationUrls(timeline, userPrompt, mode || "education", voiceId);
        } else {
            await setKokoroNarrationUrls(timeline, userPrompt, mode || "education", voiceId);
        }

        // ── 4. Bundle Remotion project ──────────────────────────────────────────
        console.log("🤖 [automate] Bundling Remotion project…");
        const bundleLocation = await bundle({
            entryPoint: path.join(process.cwd(), "src/remotion/index.ts"),
            publicDir: path.join(process.cwd(), "public"),
        });

        // ── 5. Select composition & render ──────────────────────────────────────
        const compositionId = getCompositionId(mode, orientation);
        console.log(`🤖 [automate] Rendering composition "${compositionId}"…`);

        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: compositionId,
            inputProps: timeline as unknown as Record<string, unknown>,
            chromiumOptions: { gl: "angle" },
        });

        // Output to a temp file in /out
        const outputDir = path.join(process.cwd(), "out");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const renderId = `automate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${userPrompt}-${voiceType}-${voiceId}`;
        outputPath = path.join(outputDir, `${renderId}.mp4`);

        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: "h264",
            outputLocation: outputPath,
            inputProps: timeline as unknown as Record<string, unknown>,
            chromiumOptions: { gl: "angle" },
            onProgress: ({ progress }) => {
                if (Math.round(progress * 100) % 25 === 0) {
                    console.log(`🤖 [automate] Render progress: ${Math.round(progress * 100)}%`);
                }
            },
        });

        console.log(`✅ [automate] Render complete → ${outputPath}`);

        // ── 6. Stream MP4 back ──────────────────────────────────────────────────
        const stat = fs.statSync(outputPath);
        const finalOutputPath = outputPath; // capture for cleanup closure

        const stream = new ReadableStream({
            start(controller) {
                const reader = fs.createReadStream(finalOutputPath);
                reader.on("data", (chunk) => controller.enqueue(chunk));
                reader.on("end", () => {
                    controller.close();
                    // Cleanup temp file after streaming
                    try { fs.unlinkSync(finalOutputPath); } catch { /* ignore */ }
                });
                reader.on("error", (err) => controller.error(err));
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "video/mp4",
                "Content-Length": stat.size.toString(),
                "Content-Disposition": `attachment; filename="video.mp4"`,
            },
        });
    } catch (error) {
        console.error("🤖 [automate] Error:", error);

        // Cleanup if render file was created
        if (outputPath && fs.existsSync(outputPath)) {
            try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
        }

        const errorMessage = error instanceof Error ? error.message : "Automation failed";

        // Check for quota issues
        if (errorMessage.includes("402") || errorMessage.includes("QUOTA_INSUFFICIENT")) {
            return NextResponse.json(
                { error: "TTS Quota Reached: Please refill your Typecast credits or switch to Kokoro (local)." },
                { status: 402 }
            );
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
