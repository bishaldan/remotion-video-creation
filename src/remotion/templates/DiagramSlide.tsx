import { fontFamily, loadFont } from "@remotion/google-fonts/Inter";
import React, { useMemo } from "react";
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import { GRADIENT_PRESETS, parseBackground } from "../utils/backgrounds";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600"],
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

// Auto-layout configuration
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const PADDING = 120;
const TITLE_HEIGHT = 120;

export const DiagramSlide: React.FC<DiagramSlideProps> = ({
  title,
  nodes,
  arrows,
  backgroundColor = GRADIENT_PRESETS.midnight,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // DYNAMIC SIZING: Node size based on count
  const { nodeWidth, nodeHeight, fontSize } = useMemo(() => {
    const count = nodes.length;
    if (count <= 2) return { nodeWidth: 280, nodeHeight: 100, fontSize: 24 };
    if (count <= 4) return { nodeWidth: 220, nodeHeight: 80, fontSize: 20 };
    if (count <= 6) return { nodeWidth: 180, nodeHeight: 70, fontSize: 18 };
    return { nodeWidth: 150, nodeHeight: 60, fontSize: 16 };
  }, [nodes.length]);

  // AUTO-LAYOUT: Calculate positions if nodes have default [0,0] positions
  const layoutNodes = useMemo(() => {
    // Check if all nodes are at origin (need auto-layout)
    const needsAutoLayout = nodes.every(n => n.x === 0 && n.y === 0);
    
    if (!needsAutoLayout) {
      return nodes.map(n => ({
        ...n,
        width: n.width || nodeWidth,
        height: n.height || nodeHeight,
      }));
    }

    // Auto-layout: Grid or horizontal layout based on count
    const count = nodes.length;
    const availableWidth = CANVAS_WIDTH - PADDING * 2;
    const availableHeight = CANVAS_HEIGHT - PADDING * 2 - (title ? TITLE_HEIGHT : 0);

    if (count <= 3) {
      // Horizontal layout
      const spacing = availableWidth / (count + 1);
      const centerY = availableHeight / 2 + (title ? TITLE_HEIGHT : 0);
      return nodes.map((n, i) => ({
        ...n,
        x: PADDING + spacing * (i + 1) - nodeWidth / 2,
        y: centerY - nodeHeight / 2,
        width: nodeWidth,
        height: nodeHeight,
      }));
    } else if (count <= 6) {
      // Two-row layout
      const perRow = Math.ceil(count / 2);
      const spacingY = availableHeight / 3;
      return nodes.map((n, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const rowCount = row === 0 ? perRow : count - perRow;
        const rowSpacing = availableWidth / (rowCount + 1);
        return {
          ...n,
          x: PADDING + rowSpacing * (col + 1) - nodeWidth / 2,
          y: PADDING + (title ? TITLE_HEIGHT : 0) + spacingY * (row + 1) - nodeHeight / 2,
          width: nodeWidth,
          height: nodeHeight,
        };
      });
    } else {
      // Grid layout
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const spacingX = availableWidth / (cols + 1);
      const spacingY = availableHeight / (rows + 1);
      return nodes.map((n, i) => ({
        ...n,
        x: PADDING + spacingX * ((i % cols) + 1) - nodeWidth / 2,
        y: PADDING + (title ? TITLE_HEIGHT : 0) + spacingY * (Math.floor(i / cols) + 1) - nodeHeight / 2,
        width: nodeWidth,
        height: nodeHeight,
      }));
    }
  }, [nodes, nodeWidth, nodeHeight, title]);

  // Title animation
  const titleOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Calculate timing
  const titleDuration = fps * 0.4;
  const nodesStartFrame = titleDuration;
  const nodeAnimDuration = ((durationInFrames - titleDuration) * 0.6) / Math.max(layoutNodes.length, 1);
  const arrowsStartFrame = nodesStartFrame + layoutNodes.length * nodeAnimDuration;
  const arrowAnimDuration = (durationInFrames - arrowsStartFrame) / Math.max(arrows.length, 1);

  // Get node by ID
  const getNodeById = (id: string) => layoutNodes.find((n) => n.id === id);

  // Calculate arrow path with Bezier curves
  const getArrowPath = (from: DiagramNode, to: DiagramNode) => {
    const fromW = from.width || nodeWidth;
    const fromH = from.height || nodeHeight;
    const toW = to.width || nodeWidth;
    const toH = to.height || nodeHeight;

    const fromCenterX = from.x + fromW / 2;
    const fromCenterY = from.y + fromH / 2;
    const toCenterX = to.x + toW / 2;
    const toCenterY = to.y + toH / 2;

    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;
    const angle = Math.atan2(dy, dx);

    const startX = fromCenterX + (fromW / 2 + 5) * Math.cos(angle);
    const startY = fromCenterY + (fromH / 2 + 5) * Math.sin(angle);
    const endX = toCenterX - (toW / 2 + 15) * Math.cos(angle);
    const endY = toCenterY - (toH / 2 + 15) * Math.sin(angle);

    // Bezier control point for curved arrows
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const perpX = -dy * 0.2;
    const perpY = dx * 0.2;
    const ctrlX = midX + perpX;
    const ctrlY = midY + perpY;

    return { startX, startY, endX, endY, ctrlX, ctrlY, angle };
  };

  const bgStyle = parseBackground(backgroundColor);

  return (
    <AbsoluteFill
      style={{
        ...bgStyle,
        padding: 60,
        flexDirection: "column",
      }}
    >
      {title && (
        <h1
          style={{
            fontFamily,
            fontSize: 56,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 40,
            textAlign: "center",
            opacity: titleOpacity,
            textShadow: "0 4px 20px rgba(0,0,0,0.4)",
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
              markerWidth="12"
              markerHeight="8"
              refX="10"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 12 4, 0 8" fill="#94a3b8" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {arrows.map((arrow, index) => {
            const fromNode = getNodeById(arrow.from);
            const toNode = getNodeById(arrow.to);
            if (!fromNode || !toNode) return null;

            const arrowStart = arrowsStartFrame + index * arrowAnimDuration;
            const arrowOpacity = interpolate(
              frame,
              [arrowStart, arrowStart + fps * 0.3],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            const { startX, startY, endX, endY, ctrlX, ctrlY } = getArrowPath(fromNode, toNode);

            return (
              <g key={index} style={{ opacity: arrowOpacity }}>
                <path
                  d={`M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth={3}
                  markerEnd="url(#arrowhead)"
                  filter="url(#glow)"
                />
                {arrow.label && (
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 - 10}
                    fill="#e2e8f0"
                    fontSize={14}
                    fontFamily="Inter, sans-serif"
                    textAnchor="middle"
                  >
                    {arrow.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Render nodes */}
        {layoutNodes.map((node, index) => {
          const nodeStart = nodesStartFrame + index * nodeAnimDuration;
          const nodeOpacity = interpolate(
            frame,
            [nodeStart, nodeStart + fps * 0.25],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const nodeScale = interpolate(
            frame,
            [nodeStart, nodeStart + fps * 0.25],
            [0.7, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const width = node.width || nodeWidth;
          const height = node.height || nodeHeight;

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
                borderRadius: 16,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 16,
                opacity: nodeOpacity,
                transform: `scale(${nodeScale})`,
                boxShadow: `0 8px 32px ${node.color || "#6366f1"}40`,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize,
                  fontWeight: 600,
                  color: "#ffffff",
                  textAlign: "center",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
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
