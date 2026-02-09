/**
 * Unsplash API utility for fetching stock images
 * Requires UNSPLASH_ACCESS_KEY environment variable
 */

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
  queries: string[]
): Promise<Map<string, UnsplashImage | null>> {
  const results = new Map<string, UnsplashImage | null>();
  
  // Fetch in parallel with a small delay to avoid rate limiting
  const promises = queries.map(async (query, index) => {
    // Stagger requests by 100ms each
    await new Promise((resolve) => setTimeout(resolve, index * 100));
    const image = await searchUnsplash(query);
    results.set(query, image);
  });

  await Promise.all(promises);
  return results;
}
