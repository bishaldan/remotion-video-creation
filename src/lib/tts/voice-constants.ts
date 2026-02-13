/**
 * Shared voice constants for Kokoro and Typecast.
 * Safe to import in client components (no Node.js dependencies).
 */

// ── Kokoro Voices ─────────────────────────────────────────────────────────────
// ── Kokoro Voices ─────────────────────────────────────────────────────────────
export interface KokoroVoice {
  name: string;
  gender: string;
  accent: string;
}

export const KOKORO_VOICES: Record<string, KokoroVoice> = {
  // ── American English — Female
  af_alloy:    { name: "Alloy",    gender: "female", accent: "American" },
  af_aoede:    { name: "Aoede",    gender: "female", accent: "American" },
  af_bella:    { name: "Bella",    gender: "female", accent: "American" },
  af_heart:    { name: "Heart",    gender: "female", accent: "American" },
  af_jessica:  { name: "Jessica",  gender: "female", accent: "American" },
  af_kore:     { name: "Kore",     gender: "female", accent: "American" },
  af_nicole:   { name: "Nicole",   gender: "female", accent: "American" },
  af_nova:     { name: "Nova",     gender: "female", accent: "American" },
  af_river:    { name: "River",    gender: "female", accent: "American" },
  af_sarah:    { name: "Sarah",    gender: "female", accent: "American" },
  af_sky:      { name: "Sky",      gender: "female", accent: "American" },

  // ── American English — Male
  am_adam:     { name: "Adam",     gender: "male",   accent: "American" },
  am_echo:     { name: "Echo",     gender: "male",   accent: "American" },
  am_eric:     { name: "Eric",     gender: "male",   accent: "American" },
  am_fenrir:   { name: "Fenrir",   gender: "male",   accent: "American" },
  am_liam:     { name: "Liam",     gender: "male",   accent: "American" },
  am_michael:  { name: "Michael",  gender: "male",   accent: "American" },
  am_onyx:     { name: "Onyx",     gender: "male",   accent: "American" },
  am_puck:     { name: "Puck",     gender: "male",   accent: "American" },
  am_santa:    { name: "Santa",    gender: "male",   accent: "American" },

  // ── British English — Female
  bf_alice:    { name: "Alice",    gender: "female", accent: "British" },
  bf_emma:     { name: "Emma",     gender: "female", accent: "British" },
  bf_isabella: { name: "Isabella", gender: "female", accent: "British" },
  bf_lily:     { name: "Lily",     gender: "female", accent: "British" },

  // ── British English — Male
  bm_daniel:   { name: "Daniel",   gender: "male",   accent: "British" },
  bm_fable:    { name: "Fable",    gender: "male",   accent: "British" },
  bm_george:   { name: "George",   gender: "male",   accent: "British" },
  bm_lewis:    { name: "Lewis",    gender: "male",   accent: "British" },
};

// ── Typecast Voices ───────────────────────────────────────────────────────────
export interface TypecastVoice {
  name: string;
  gender: string;
  description: string;
  model?: string;
}

export const TYPECAST_VOICES: Record<string, TypecastVoice> = {
  // ── Popular Voices
  "tc_6791c4a4c79515dea68b4a75": { name: "Logan",    gender: "male",   description: "Teenager, Conversational", model: "ssfm-v30" },
  "tc_62a8975e695ad26f7fb514d1": { name: "Olivia",   gender: "female", description: "Young Adult, Warm", model: "ssfm-v21" },
  "tc_67d237aac9ac563922580832": { name: "Sylvia",   gender: "female", description: "Middle Aged, Mature", model: "ssfm-v21" },
  "tc_63049449e7dfae64b10c6cb9": { name: "Agatha",   gender: "female", description: "Elder, Storyteller", model: "ssfm-v21" },
  "tc_6347828cd3835443f0fcd572": { name: "Tina",     gender: "female", description: "Teenager, Energetic", model: "ssfm-v30" },
  "tc_660e5c11eef728e75f95f520": { name: "Chester",  gender: "male",   description: "Young Adult, Casual", model: "ssfm-v21" },
  "tc_68f9c6a72f0f04a417bb136f": { name: "Moonjung", gender: "female", description: "Young Adult, Soft", model: "ssfm-v30" },
  "tc_68d4b115f0486108a7eefb37": { name: "Kangil",   gender: "male",   description: "Young Adult, Friendly", model: "ssfm-v30" },
  "tc_68785db8ba9cd7503f27d921": { name: "Gowoon",   gender: "female", description: "Young Adult, Bright", model: "ssfm-v30" },
  "tc_689450bdcce4027c2f06eee8": { name: "Alena",    gender: "female", description: "Young Adult, Professional", model: "ssfm-v30" },
  "tc_686dc43ebd6351e06ee64d74": { name: "Wonwoo",   gender: "male",   description: "Young Adult, Calm", model: "ssfm-v30" },
  "tc_688185a9183d96f8ca52885e": { name: "Anja",     gender: "female", description: "Young Adult, Narrator", model: "ssfm-v21" },
  "tc_686dc45bbd6351e06ee64daf": { name: "Elise",    gender: "female", description: "Middle Aged, Elegant", model: "ssfm-v21" },
  "tc_68662745779b66ba84fc4d84": { name: "Seheon",   gender: "male",   description: "Young Adult, Dynamic", model: "ssfm-v30" },
  "tc_685cdfad4027aeec7d097a28": { name: "Cheolhoon",gender: "male",   description: "Middle Aged, Deep", model: "ssfm-v21" },
  "tc_685ca2dcfa58f44bdbe60d65": { name: "Wade",     gender: "male",   description: "Middle Aged, Authoritative", model: "ssfm-v30" },
  "tc_68537c9420b646f2176890ba": { name: "Seojin",   gender: "female", description: "Young Adult, Clear", model: "ssfm-v30" },
  "tc_684a5a7ba2ce934624b59c6e": { name: "Nia",      gender: "female", description: "Middle Aged, Warm", model: "ssfm-v21" },
  "tc_6837b58f80ceeb17115bb771": { name: "Walter",   gender: "male",   description: "Young Adult, Friendly", model: "ssfm-v21" },
  "tc_684a7a1446e2a628b5b07230": { name: "Jaesun",   gender: "female", description: "Middle Aged, Calm", model: "ssfm-v21" },
};
