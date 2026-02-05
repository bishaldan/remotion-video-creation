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
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const progressResponse = await fetch(`/api/render-local?renderId=${renderId}`);
        const progressData = await progressResponse.json();

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
