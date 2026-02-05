import { NextRequest, NextResponse } from "next/server";
import { type Timeline } from "../../../../types/constants";

// Mock timeline generator - returns example timelines based on prompt keywords
function generateMockTimeline(prompt: string): Timeline {
  const lowerPrompt = prompt.toLowerCase();

  // Detect topic and create appropriate slides
  if (
    lowerPrompt.includes("photosynthesis") ||
    lowerPrompt.includes("plant")
  ) {
    return {
      title: "Understanding Photosynthesis",
      defaultSlideDuration: 5,
      slides: [
        {
          type: "text",
          text: "Photosynthesis: How Plants Make Food",
          animation: "wordByWord",
          fontSize: 72,
          color: "#1a5f2a",
          backgroundColor: "#e8f5e9",
          durationInSeconds: 4,
        },
        {
          type: "bullets",
          title: "Key Ingredients",
          bullets: [
            "Sunlight - The energy source",
            "Carbon Dioxide (CO₂) - From the air",
            "Water (H₂O) - From the roots",
            "Chlorophyll - The green pigment",
          ],
          backgroundColor: "#f1f8e9",
          durationInSeconds: 6,
        },
        {
          type: "diagram",
          title: "The Process",
          nodes: [
            { id: "sun", label: "Sunlight", x: 100, y: 50, color: "#ffc107" },
            { id: "co2", label: "CO₂", x: 100, y: 200, color: "#78909c" },
            { id: "h2o", label: "H₂O", x: 100, y: 350, color: "#2196f3" },
            { id: "leaf", label: "Chloroplast", x: 400, y: 200, color: "#4caf50", width: 180 },
            { id: "glucose", label: "Glucose", x: 700, y: 150, color: "#ff9800" },
            { id: "o2", label: "O₂", x: 700, y: 280, color: "#03a9f4" },
          ],
          arrows: [
            { from: "sun", to: "leaf" },
            { from: "co2", to: "leaf" },
            { from: "h2o", to: "leaf" },
            { from: "leaf", to: "glucose" },
            { from: "leaf", to: "o2" },
          ],
          backgroundColor: "#fafafa",
          durationInSeconds: 8,
        },
        {
          type: "text",
          text: "6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂",
          animation: "typewriter",
          fontSize: 48,
          color: "#2e7d32",
          backgroundColor: "#e8f5e9",
          durationInSeconds: 5,
        },
      ],
    };
  }

  if (lowerPrompt.includes("machine learning") || lowerPrompt.includes("ai")) {
    return {
      title: "Introduction to Machine Learning",
      defaultSlideDuration: 5,
      slides: [
        {
          type: "text",
          text: "Machine Learning: Teaching Computers to Learn",
          animation: "fadeIn",
          fontSize: 64,
          color: "#ffffff",
          backgroundColor: "#1a1a2e",
          durationInSeconds: 4,
        },
        {
          type: "bullets",
          title: "Types of Machine Learning",
          bullets: [
            "Supervised Learning - Learning from labeled data",
            "Unsupervised Learning - Finding patterns in data",
            "Reinforcement Learning - Learning through rewards",
          ],
          titleColor: "#6366f1",
          backgroundColor: "#0f172a",
          bulletColor: "#e2e8f0",
          durationInSeconds: 6,
        },
        {
          type: "threeD",
          title: "Neural Network Node",
          shape: "sphere",
          color: "#8b5cf6",
          backgroundColor: "#0f172a",
          durationInSeconds: 5,
        },
        {
          type: "diagram",
          title: "ML Pipeline",
          nodes: [
            { id: "data", label: "Data", x: 50, y: 180, color: "#3b82f6" },
            { id: "prep", label: "Preprocessing", x: 220, y: 180, color: "#06b6d4" },
            { id: "train", label: "Training", x: 420, y: 180, color: "#8b5cf6" },
            { id: "eval", label: "Evaluation", x: 620, y: 180, color: "#f59e0b" },
            { id: "deploy", label: "Deployment", x: 820, y: 180, color: "#10b981" },
          ],
          arrows: [
            { from: "data", to: "prep" },
            { from: "prep", to: "train" },
            { from: "train", to: "eval" },
            { from: "eval", to: "deploy" },
          ],
          backgroundColor: "#0f172a",
          durationInSeconds: 7,
        },
      ],
    };
  }

  if (lowerPrompt.includes("water cycle") || lowerPrompt.includes("rain")) {
    return {
      title: "The Water Cycle",
      defaultSlideDuration: 5,
      slides: [
        {
          type: "text",
          text: "The Water Cycle: Nature's Recycling System",
          animation: "wordByWord",
          fontSize: 64,
          color: "#0277bd",
          backgroundColor: "#e1f5fe",
          durationInSeconds: 4,
        },
        {
          type: "bullets",
          title: "Four Main Stages",
          bullets: [
            "Evaporation - Water turns to vapor",
            "Condensation - Vapor forms clouds",
            "Precipitation - Water falls as rain/snow",
            "Collection - Water gathers in bodies of water",
          ],
          bulletIcon: "💧",
          backgroundColor: "#e3f2fd",
          durationInSeconds: 6,
        },
        {
          type: "diagram",
          title: "The Cycle",
          nodes: [
            { id: "ocean", label: "Ocean", x: 100, y: 320, color: "#0288d1", width: 180 },
            { id: "evap", label: "Evaporation", x: 350, y: 220, color: "#ff9800" },
            { id: "cloud", label: "Clouds", x: 550, y: 80, color: "#90a4ae", width: 160 },
            { id: "rain", label: "Precipitation", x: 750, y: 220, color: "#42a5f5" },
            { id: "ground", label: "Ground/Rivers", x: 900, y: 320, color: "#8d6e63", width: 180 },
          ],
          arrows: [
            { from: "ocean", to: "evap" },
            { from: "evap", to: "cloud" },
            { from: "cloud", to: "rain" },
            { from: "rain", to: "ground" },
            { from: "ground", to: "ocean" },
          ],
          backgroundColor: "#e0f7fa",
          durationInSeconds: 8,
        },
        {
          type: "threeD",
          title: "Water Molecule",
          shape: "sphere",
          color: "#29b6f6",
          backgroundColor: "#01579b",
          durationInSeconds: 4,
        },
      ],
    };
  }


  return {
    title: `Understanding: ${prompt.slice(0, 50)}`,
    defaultSlideDuration: 5,
    slides: [
      {
        type: "text",
        text: prompt.slice(0, 100),
        animation: "wordByWord",
        fontSize: 56,
        durationInSeconds: 4,
      },
      {
        type: "bullets",
        title: "Key Points",
        bullets: [
          "Important concept #1",
          "Important concept #2",
          "Important concept #3",
          "Summary and takeaways",
        ],
        durationInSeconds: 5,
      },
      {
        type: "threeD",
        title: "Visual Representation",
        shape: "cube",
        color: "#6366f1",
        backgroundColor: "#1e1b4b",
        durationInSeconds: 4,
      },
      {
        type: "text",
        text: "Thank you for learning!",
        animation: "fadeIn",
        fontSize: 64,
        durationInSeconds: 3,
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Generate mock timeline (replace with AI integration later)
    const timeline = generateMockTimeline(prompt);

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate timeline" },
      { status: 500 }
    );
  }
}
