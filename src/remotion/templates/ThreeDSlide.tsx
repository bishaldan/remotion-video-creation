import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

export type ThreeDShape = "cube" | "sphere" | "pyramid" | "torus" | "cylinder";

export interface ThreeDSlideProps {
  title?: string;
  shape?: ThreeDShape;
  color?: string;
  backgroundColor?: string;
  autoRotate?: boolean;
}

interface ShapeProps {
  shape: ThreeDShape;
  color: string;
  progress: number;
}

const AnimatedShape: React.FC<ShapeProps> = ({ shape, color, progress }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = progress * Math.PI * 2;
      meshRef.current.rotation.x = progress * Math.PI * 0.5;
    }
  });

  const scale = interpolate(progress, [0, 0.2], [0, 1], {
    extrapolateRight: "clamp",
  });

  const renderGeometry = () => {
    switch (shape) {
      case "cube":
        return <boxGeometry args={[2, 2, 2]} />;
      case "sphere":
        return <sphereGeometry args={[1.2, 32, 32]} />;
      case "pyramid":
        return <coneGeometry args={[1.2, 2, 4]} />;
      case "torus":
        return <torusGeometry args={[1, 0.4, 16, 48]} />;
      case "cylinder":
        return <cylinderGeometry args={[1, 1, 2, 32]} />;
      default:
        return <boxGeometry args={[2, 2, 2]} />;
    }
  };

  return (
    <mesh ref={meshRef} scale={[scale, scale, scale]}>
      {renderGeometry()}
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
};

export const ThreeDSlide: React.FC<ThreeDSlideProps> = ({
  title,
  shape = "cube",
  color = "#6366f1",
  backgroundColor = "#0f172a",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;

  // Title animation
  const titleOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
        position: "relative",
      }}
    >
      {title && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 10,
            opacity: titleOpacity,
          }}
        >
          <h1
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 48,
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {title}
          </h1>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#818cf8" />
        <AnimatedShape shape={shape} color={color} progress={progress} />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
};
