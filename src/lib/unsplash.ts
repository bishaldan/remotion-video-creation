/**
 * Unsplash API utility for fetching stock images
 * Requires UNSPLASH_ACCESS_KEY environment variable
 */

import { Timeline } from "../../types/edu";
import { QuizTimeline, SingleQuizTimeline } from "../../types/quiz";

const UNSPLASH_API_URL = "https://api.unsplash.com";

export interface UnsplashImage {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

/**
 * Search for images on Unsplash
 * @param query - Search keywords
 * @param orientation - Image orientation (landscape recommended for video)
 */
export async function searchUnsplash(
  query: string,
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<UnsplashImage | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY not set, using placeholder image");
    return getPlaceholderImage(query);
  }

  try {
    const params = new URLSearchParams({
      query,
      orientation,
      per_page: "1",
    });

    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?${params}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Unsplash API error:", response.status);
      return getPlaceholderImage(query);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.warn(`No Unsplash results for query: ${query}`);
      return getPlaceholderImage(query);
    }

    const photo = data.results[0];
    
    return {
      id: photo.id,
      url: photo.urls.regular, // 1080px width
      thumbUrl: photo.urls.thumb,
      alt: photo.alt_description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
    };
  } catch (error) {
    console.error("Unsplash fetch error:", error);
    return getPlaceholderImage(query);
  }
}

/**
 * Get a placeholder image when Unsplash is unavailable
 * Uses a gradient placeholder with the query text
 */
function getPlaceholderImage(query: string): UnsplashImage {
  // Use Unsplash Source for a random image based on query (no API key needed)
  // This is a fallback that still provides relevant images
  const encodedQuery = encodeURIComponent(query);
  return {
    id: `placeholder-${Date.now()}`,
    url: `https://source.unsplash.com/1920x1080/?${encodedQuery}`,
    thumbUrl: `https://source.unsplash.com/400x300/?${encodedQuery}`,
    alt: query,
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
  };
}

/**
 * Batch fetch multiple images for a timeline
 */
export async function batchSearchUnsplash(
  queries: string[],
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<Map<string, UnsplashImage | null>> {
  const results = new Map<string, UnsplashImage | null>();
  
  // Fetch in parallel with a small delay to avoid rate limiting
  const promises = queries.map(async (query, index) => {
    // Stagger requests by 100ms each
    await new Promise((resolve) => setTimeout(resolve, index * 100));
    const image = await searchUnsplash(query, orientation);
    results.set(query, image);
  });

  await Promise.all(promises);
  return results;
}

export async function setImagesUrl(timeline: Timeline | QuizTimeline | SingleQuizTimeline, orientation: "landscape" | "portrait" | "squarish" = "landscape") {
      const imageQueries: string[] = [];
      const imageSlides: number[] = [];

      // Identify image slides and collect queries
      timeline.slides.forEach((slide: any, index: number) => {
        if (slide.type === "image" && slide.imageQuery) {
          imageQueries.push(slide.imageQuery);
          imageSlides.push(index);
        } else if (slide.type === "quiz" && slide.backgroundQuery) {
          imageQueries.push(slide.backgroundQuery);
          imageSlides.push(index);
        } else if (slide.type === "singleQuiz" && slide.imageQuery) {
          imageQueries.push(slide.imageQuery);
          imageSlides.push(index);
        }
      });

      // Batch fetch from Unsplash
      if (imageQueries.length > 0) {
        console.log("Fetching Unsplash images for:", imageQueries);
        
        const imagesMap = await batchSearchUnsplash(imageQueries, orientation);
        // await Promise.all(imageQueries.map(async (query, i) => {
        //      await new Promise(r => setTimeout(r, i * 50));
        //      const searchOrientation = orientation === "portrait" ? "portrait" : "landscape";
        //      const image = await batchSearchUnsplash(query, searchOrientation);
        //      imagesMap.set(query, image);
        // }));

        // Update slides with resolved URLs
        for (let i = 0; i < imageSlides.length; i++) {
          const slideIndex = imageSlides[i];
          const query = imageQueries[i];
          const image = imagesMap.get(query);
          const slide = timeline.slides[slideIndex] as any;
          
          if (image) {
             if (slide.type === "image") slide.imageUrl = image.url;
             else if (slide.type === "quiz") slide.backgroundUrl = image.url;
             else if (slide.type === "singleQuiz") slide.imageUrl = image.url;
          } else {
              const fallbackUrl = `https://source.unsplash.com/${orientation === 'portrait' ? '1080x1920' : '1920x1080'}/?${encodeURIComponent(query)}`;
              if (slide.type === "image") slide.imageUrl = fallbackUrl;
              else if (slide.type === "quiz") slide.backgroundUrl = fallbackUrl;
              else if (slide.type === "singleQuiz") slide.imageUrl = fallbackUrl;
          }
        }
      }
}