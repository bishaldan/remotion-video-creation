import { getInputProps, staticFile } from "remotion";

/**
 * Resolves the audio URL for narration.
 * When assetBaseUrl is provided (e.g. in Docker render), fetches from the app server.
 * In the Player, getInputProps() is not available – props come from the component, so we use staticFile.
 */
export function getAudioSrc(narrationUrl: string): string {
  try {
    const inputProps = getInputProps() as { assetBaseUrl?: string } | undefined;
    const baseUrl = inputProps?.assetBaseUrl?.replace(/\/$/, "");

    if (baseUrl && narrationUrl) {
      const path = narrationUrl.startsWith("/") ? narrationUrl : `/${narrationUrl}`;
      return `${baseUrl}${path}`;
    }
  } catch {
    // In the Player, getInputProps() throws – props come from the component. Use staticFile.
  }

  const src = staticFile(narrationUrl);

  console.log(`[AudioSrc] Resolved: ${narrationUrl} -> ${src}`);


  return src;
}
