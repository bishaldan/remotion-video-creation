/**
 * Image Search Service with Cascading Fallback
 *
 * Fallback chain: Unsplash → Pexels → Pixabay → Wikimedia Commons
 *
 * Environment variables (all optional — system works with zero config via Wikimedia):
 *   UNSPLASH_ACCESS_KEY  — primary source, curated photography
 *   PEXELS_API_KEY       — second tier, high quality
 *   PIXABAY_API_KEY      — third tier, 5M+ images
 *   (Wikimedia needs no key)
 */

import { Timeline } from "../../../types/edu";
import { KidsTimeline } from "../../../types/edu-kids";
import { DualQuizTimeline, SingleQuizTimeline } from "../../../types/quiz";

// ─────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────

export interface ImageResult {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  source: "unsplash" | "pexels" | "pixabay" | "wikimedia";
}

// Keep the old name for backward compat
export type UnsplashImage = ImageResult;

// ─────────────────────────────────────────────────────────────────
// 1. Unsplash
// ─────────────────────────────────────────────────────────────────

async function searchUnsplashProvider(
  query: string,
  orientation: "landscape" | "portrait" | "squarish"
): Promise<ImageResult | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) return null;

  try {
    const params = new URLSearchParams({ query, orientation, per_page: "1" });
    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );

    if (!response.ok) {
      console.warn(`[Unsplash] API error ${response.status} for "${query}"`);
      return null;
    }

    const data = await response.json();
    if (!data.results?.length) {
      console.warn(`[Unsplash] No results for "${query}"`);
      return null;
    }

    const photo = data.results[0];
    return {
      id: photo.id,
      url: photo.urls.regular,
      thumbUrl: photo.urls.thumb,
      alt: photo.alt_description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      source: "unsplash",
    };
  } catch (error) {
    console.error("[Unsplash] Fetch error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. Pexels
// ─────────────────────────────────────────────────────────────────

async function searchPexels(
  query: string,
  orientation: "landscape" | "portrait" | "squarish"
): Promise<ImageResult | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const pexelsOrientation = orientation === "squarish" ? "landscape" : orientation;
    const params = new URLSearchParams({
      query,
      orientation: pexelsOrientation,
      per_page: "1",
    });

    const response = await fetch(
      `https://api.pexels.com/v1/search?${params}`,
      { headers: { Authorization: apiKey } }
    );

    if (!response.ok) {
      console.warn(`[Pexels] API error ${response.status} for "${query}"`);
      return null;
    }

    const data = await response.json();
    if (!data.photos?.length) {
      console.warn(`[Pexels] No results for "${query}"`);
      return null;
    }

    const photo = data.photos[0];
    return {
      id: String(photo.id),
      url: photo.src.large2x || photo.src.large,
      thumbUrl: photo.src.small,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      source: "pexels",
    };
  } catch (error) {
    console.error("[Pexels] Fetch error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. Pixabay
// ─────────────────────────────────────────────────────────────────

async function searchPixabay(
  query: string,
  orientation: "landscape" | "portrait" | "squarish"
): Promise<ImageResult | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return null;

  try {
    const pixabayOrientation = orientation === "squarish" ? "horizontal" : orientation === "portrait" ? "vertical" : "horizontal";
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      orientation: pixabayOrientation,
      per_page: "3",
      image_type: "photo",
      safesearch: "true",
    });

    const response = await fetch(`https://pixabay.com/api/?${params}`);

    if (!response.ok) {
      console.warn(`[Pixabay] API error ${response.status} for "${query}"`);
      return null;
    }

    const data = await response.json();
    if (!data.hits?.length) {
      console.warn(`[Pixabay] No results for "${query}"`);
      return null;
    }

    const photo = data.hits[0];
    return {
      id: String(photo.id),
      url: photo.largeImageURL,
      thumbUrl: photo.previewURL,
      alt: photo.tags || query,
      photographer: photo.user,
      photographerUrl: `https://pixabay.com/users/${photo.user_id}/`,
      source: "pixabay",
    };
  } catch (error) {
    console.error("[Pixabay] Fetch error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// 4. Wikimedia Commons (no API key needed)
// ─────────────────────────────────────────────────────────────────

async function searchWikimedia(
  query: string
): Promise<ImageResult | null> {
  try {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "6", // File namespace
      gsrlimit: "5",
      prop: "imageinfo",
      iiprop: "url|extmetadata|size",
      iiurlwidth: "1920",
      format: "json",
      origin: "*",
    });

    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`
    );

    if (!response.ok) {
      console.warn(`[Wikimedia] API error ${response.status} for "${query}"`);
      return null;
    }

    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) {
      console.warn(`[Wikimedia] No results for "${query}"`);
      return null;
    }

    // Find the first actual image (not .svg, .ogg, etc.)
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const entries = Object.values(pages) as any[];
    const image = entries.find((page: any) => {
      const title = (page.title || "").toLowerCase();
      return imageExtensions.some((ext) => title.endsWith(ext));
    });

    if (!image?.imageinfo?.length) {
      console.warn(`[Wikimedia] No suitable image found for "${query}"`);
      return null;
    }

    const info = image.imageinfo[0];
    const meta = info.extmetadata || {};
    const artist = meta.Artist?.value?.replace(/<[^>]*>/g, "") || "Wikimedia";

    return {
      id: `wiki-${image.pageid}`,
      url: info.thumburl || info.url,
      thumbUrl: info.thumburl || info.url,
      alt: meta.ImageDescription?.value?.replace(/<[^>]*>/g, "")?.slice(0, 200) || query,
      photographer: artist,
      photographerUrl: info.descriptionurl || "https://commons.wikimedia.org",
      source: "wikimedia",
    };
  } catch (error) {
    console.error("[Wikimedia] Fetch error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Cascading search: try each provider in order
// ─────────────────────────────────────────────────────────────────

export async function searchImage(
  query: string,
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<ImageResult | null> {
  // 1. Unsplash (primary)
  const unsplash = await searchUnsplashProvider(query, orientation);
  if (unsplash) {
    console.log(`  ✓ [Image] "${query}" → Unsplash`);
    return unsplash;
  }

  // 2. Pexels (if API key set)
  const pexels = await searchPexels(query, orientation);
  if (pexels) {
    console.log(`  ✓ [Image] "${query}" → Pexels (fallback)`);
    return pexels;
  }

  // 3. Pixabay (if API key set)
  const pixabay = await searchPixabay(query, orientation);
  if (pixabay) {
    console.log(`  ✓ [Image] "${query}" → Pixabay (fallback)`);
    return pixabay;
  }

  // 4. Wikimedia Commons (always available, no key needed)
  const wiki = await searchWikimedia(query);
  if (wiki) {
    console.log(`  ✓ [Image] "${query}" → Wikimedia Commons (fallback)`);
    return wiki;
  }

  console.warn(`  ✗ [Image] "${query}" → No image found from any provider`);
  return null;
}

// Keep old name as alias for backward compat
export const searchUnsplash = searchImage;

// ─────────────────────────────────────────────────────────────────
// Batch fetch
// ─────────────────────────────────────────────────────────────────

export async function batchSearchImages(
  queries: string[],
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<Map<string, ImageResult | null>> {
  const results = new Map<string, ImageResult | null>();

  const promises = queries.map(async (query, index) => {
    await new Promise((resolve) => setTimeout(resolve, index * 150));
    const image = await searchImage(query, orientation);
    results.set(query, image);
  });

  await Promise.all(promises);
  return results;
}

// Keep old name as alias
export const batchSearchUnsplash = batchSearchImages;

// ─────────────────────────────────────────────────────────────────
// setImagesUrl — resolve image URLs for an entire timeline
// ─────────────────────────────────────────────────────────────────

export async function setImagesUrl(
  timeline: Timeline | DualQuizTimeline | SingleQuizTimeline | KidsTimeline,
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
) {
  // User Request: Prioritize 'portrait' orientation for DualQuiz mode regardless of video orientation
  const isDualQuiz = (timeline as any).mode === "dualQuiz" || timeline.slides.some((s: any) => s.type === "dualQuiz");
  const effectiveOrientation = isDualQuiz ? "portrait" : orientation;
  const imageQueries: string[] = [];
  const imageSlides: number[] = [];

  // Track kidsContent slides separately (they have multiple images)
  const kidsContentSlides: { slideIndex: number; queries: string[] }[] = [];

  timeline.slides.forEach((slide: any, index: number) => {
    if (slide.type === "image" && slide.imageQuery) {
      imageQueries.push(slide.imageQuery);
      imageSlides.push(index);
    } else if (slide.type === "dualQuiz" && slide.backgroundQuery) {
      imageQueries.push(slide.backgroundQuery);
      imageSlides.push(index);
    } else if (slide.type === "singleQuiz" && slide.imageQuery) {
      imageQueries.push(slide.imageQuery);
      imageSlides.push(index);
    } else if (slide.type === "kidsContent" && slide.backgroundImageQueries) {
      kidsContentSlides.push({ slideIndex: index, queries: slide.backgroundImageQueries });
      // Add all queries to the batch with kid-friendly modifiers
      for (const q of slide.backgroundImageQueries) {
        const modifiedQuery = q;
        imageQueries.push(modifiedQuery);
      }
    }
  });

  if (imageQueries.length > 0) {
    console.log(`Fetching images for ${isDualQuiz ? "DualQuiz (forced portrait)" : "timeline"}...`);

    const imagesMap = await batchSearchImages(imageQueries, effectiveOrientation);

    // Handle standard slides
    let queryIndex = 0;
    for (let i = 0; i < imageSlides.length; i++) {
      const slideIndex = imageSlides[i];
      const query = imageQueries[queryIndex];
      const image = imagesMap.get(query);
      const slide = timeline.slides[slideIndex] as any;

      if (image) {
        if (slide.type === "image") slide.imageUrl = image.url;
        else if (slide.type === "dualQuiz") slide.backgroundUrl = image.url;
        else if (slide.type === "singleQuiz") slide.imageUrl = image.url;
      }
      queryIndex++;
    }

    // Handle kidsContent slides (multiple images per slide)
    for (const kidsSlide of kidsContentSlides) {
      const slide = timeline.slides[kidsSlide.slideIndex] as any;
      const urls: string[] = [];
      for (const q of kidsSlide.queries) {
        // We must reconstruct the modified query to retrieve from the map
        const modifiedQuery = q;
        const image = imagesMap.get(modifiedQuery);
        if (image) {
          urls.push(image.url);
        }
      }
      slide.backgroundImageUrls = urls;
      console.log(`  → kidsContent slide ${kidsSlide.slideIndex}: ${urls.length} background images resolved`);
    }
  }
}