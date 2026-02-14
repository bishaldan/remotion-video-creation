import { useCallback, useMemo, useState } from "react";

export type LocalRenderState =
  | { status: "init" }
  | { status: "invoking" }
  | { status: "rendering"; progress: number; renderId: string }
  | { status: "error"; error: Error }
  | { status: "done"; outputPath: string; renderId: string };

export const useLocalRendering = <T extends Record<string, unknown>>(
  compositionId: string,
  inputProps: T,
  saveAs: string
) => {
  const [state, setState] = useState<LocalRenderState>({ status: "init" });

  const renderMedia = useCallback(async () => {
    setState({ status: "invoking" });

    try {
      // Start the render
      const response = await fetch("/api/render-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionId, inputProps, saveAs }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start render");
      }

      const { renderId } = await response.json();

      setState({ status: "rendering", progress: 0, renderId });

      // Poll for progress
      let done = false;
      let retryCount = 0;
      const MAX_RETRIES = 5;
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          const progressResponse = await fetch(`/api/render-local?renderId=${renderId}`);

          if (!progressResponse.ok) {
            retryCount++;
            console.warn(`Poll returned ${progressResponse.status}, retry ${retryCount}/${MAX_RETRIES}`);
            if (retryCount >= MAX_RETRIES) {
              throw new Error(`Server returned ${progressResponse.status} — render may have crashed (out of memory?)`);
            }
            continue;
          }

          const text = await progressResponse.text();
          if (!text) {
            retryCount++;
            if (retryCount >= MAX_RETRIES) throw new Error("Empty response from server");
            continue;
          }

          const progressData = JSON.parse(text);
          retryCount = 0; // Reset on success

          if (progressData.status === "error") {
            throw new Error(progressData.error || "Render failed");
          }

          if (progressData.status === "done") {
            setState({ status: "done", outputPath: progressData.outputPath, renderId });
            done = true;
          } else {
            setState({
              status: "rendering",
              progress: progressData.progress || 0,
              renderId,
            });
          }
        } catch (pollError) {
          if (pollError instanceof SyntaxError) {
            retryCount++;
            console.warn(`Non-JSON response, retry ${retryCount}/${MAX_RETRIES}`);
            if (retryCount >= MAX_RETRIES) {
              throw new Error("Server is not returning valid responses — render likely crashed");
            }
          } else {
            throw pollError;
          }
        }
      }
    } catch (err) {
      setState({
        status: "error",
        error: err instanceof Error ? err : new Error("Unknown error"),
      });
    }
  }, [compositionId, inputProps]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  return useMemo(
    () => ({ renderMedia, state, undo }),
    [renderMedia, state, undo]
  );
};
