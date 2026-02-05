import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500"],
});

export interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
}

export interface DiagramArrow {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramSlideProps {
  title?: string;
  nodes: DiagramNode[];
  arrows: DiagramArrow[];
  backgroundColor?: string;
}

const NODE_DEFAULT_WIDTH = 160;
const NODE_DEFAULT_HEIGHT = 60;

export const DiagramSlide: React.FC<DiagramSlideProps> = ({
  title,
  nodes,
  arrows,
  backgroundColor = "#f8fafc",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Calculate timing
  const titleDuration = fps * 0.4;
  const nodesStartFrame = titleDuration;
  const nodeAnimDuration = ((durationInFrames - titleDuration) * 0.6) / nodes.length;
  const arrowsStartFrame = nodesStartFrame + nodes.length * nodeAnimDuration;
  const arrowAnimDuration = (durationInFrames - arrowsStartFrame) / Math.max(arrows.length, 1);

  // Get node by ID
  const getNodeById = (id: string): DiagramNode | undefined =>
    nodes.find((n) => n.id === id);

  // Calculate arrow path
  const getArrowPath = (from: DiagramNode, to: DiagramNode) => {
    const fromW = from.width || NODE_DEFAULT_WIDTH;
    const fromH = from.height || NODE_DEFAULT_HEIGHT;
    const toW = to.width || NODE_DEFAULT_WIDTH;
    const toH = to.height || NODE_DEFAULT_HEIGHT;

    const fromCenterX = from.x + fromW / 2;
    const fromCenterY = from.y + fromH / 2;
    const toCenterX = to.x + toW / 2;
    const toCenterY = to.y + toH / 2;

    // Simple straight line from edge to edge
    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;
    const angle = Math.atan2(dy, dx);

    const startX = fromCenterX + (fromW / 2) * Math.cos(angle);
    const startY = fromCenterY + (fromH / 2) * Math.sin(angle);
    const endX = toCenterX - (toW / 2 + 10) * Math.cos(angle);
    const endY = toCenterY - (toH / 2 + 10) * Math.sin(angle);

    return { startX, startY, endX, endY, angle };
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        padding: 60,
        flexDirection: "column",
      }}
    >
      {title && (
        <h1
          style={{
            fontFamily,
            fontSize: 48,
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: 40,
            textAlign: "center",
            opacity: titleOpacity,
          }}
        >
          {title}
        </h1>
      )}

      <div style={{ flex: 1, position: "relative" }}>
        {/* Render arrows */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>
          {arrows.map((arrow, index) => {
            const fromNode = getNodeById(arrow.from);
            const toNode = getNodeById(arrow.to);
            if (!fromNode || !toNode) return null;

            const arrowStart = arrowsStartFrame + index * arrowAnimDuration;
            const arrowOpacity = interpolate(
              frame,
              [arrowStart, arrowStart + fps * 0.2],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            const { startX, startY, endX, endY } = getArrowPath(fromNode, toNode);

            return (
              <line
                key={index}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#64748b"
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
                style={{ opacity: arrowOpacity }}
              />
            );
          })}
        </svg>

        {/* Render nodes */}
        {nodes.map((node, index) => {
          const nodeStart = nodesStartFrame + index * nodeAnimDuration;
          const nodeOpacity = interpolate(
            frame,
            [nodeStart, nodeStart + fps * 0.2],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const nodeScale = interpolate(
            frame,
            [nodeStart, nodeStart + fps * 0.2],
            [0.8, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const width = node.width || NODE_DEFAULT_WIDTH;
          const height = node.height || NODE_DEFAULT_HEIGHT;

          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: node.x,
                top: node.y,
                width,
                height,
                backgroundColor: node.color || "#6366f1",
                borderRadius: 12,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 12,
                opacity: nodeOpacity,
                transform: `scale(${nodeScale})`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
