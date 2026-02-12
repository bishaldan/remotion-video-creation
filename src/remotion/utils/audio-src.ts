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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fc87d80b-32df-4cea-9fe1-142209615e5e', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id: `log_${Date.now()}`,
      location: 'src/remotion/utils/audio-src.ts:getAudioSrc',
      message: 'Resolved audio src',
      hypothesisId: 'H4',
      runId: 'docker-audio',
      timestamp: Date.now(),
      data: {
        narrationUrl,
        src,
      },
    }),
  }).catch(() => {});
  // #endregion

  return src;
}
