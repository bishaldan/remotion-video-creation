import { Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

export type ThreeDShape = "cube" | "sphere" | "pyramid" | "torus" | "cylinder";

export interface ThreeDObject {
  shape: ThreeDShape;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: number;
  color: string;
  label?: string;
  showTrajectory?: boolean;
  orbitSpeed?: number;
  animation: "none" | "orbit" | "pulse" | "float" | "rotate";
}

export interface ThreeDSlideProps {
  title?: string;
  objects?: ThreeDObject[];
  cameraPosition?: [number, number, number];
  shape?: ThreeDShape;
  color?: string;
  backgroundColor?: string;
}

interface ShapeProps {
  object: ThreeDObject;
  progress: number;
}

const OrbitPath: React.FC<{ radius: number; color: string }> = ({ radius, color }) => {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.01, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} />
    </mesh>
  );
};

const AnimatedShape: React.FC<ShapeProps> = ({ object, progress }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { shape, color, position, scale: baseScale, animation: rawAnimation, label } = object;

  // FIX: Disable pulse animation for spheres per user request
  const animation = (shape === "sphere" && rawAnimation === "pulse") ? "none" : rawAnimation;

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      
      const [rx, ry, rz] = object.rotation || [0, 0, 0];
      
      // CRITICAL FIX: Only apply base rotation. Do NOT auto-spin unless requested.
      meshRef.current.rotation.x = rx;
      meshRef.current.rotation.y = ry;
      meshRef.current.rotation.z = rz;

      // Animation logic
      // Animation logic
      if (animation === "float") {
        meshRef.current.position.y = position[1] + Math.sin(t * 2) * 0.2;
      } else if (animation === "pulse") {
        const pulse = 1 + Math.sin(t * 4) * 0.1;
        meshRef.current.scale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);
      } else if (animation === "orbit") {
        // RADICAL FIX: Ignore initial position for the 'center' of orbit. 
        // Orbit radius is determined by the distance of initial position from center [0,0,0]
        const radius = Math.sqrt(position[0]**2 + position[2]**2) || 2;
        const initialAngle = Math.atan2(position[2], position[0]);
        const angle = t * (object.orbitSpeed || 1) + initialAngle; // Support custom speed if property added later, else default
        
        // Apply position DIRECTLY to mesh relative to group at [0,0,0] if we move group there
        meshRef.current.position.x = Math.cos(angle) * radius;
        meshRef.current.position.z = Math.sin(angle) * radius;
        // Keep Y from initial position
        meshRef.current.position.y = position[1];
      } else if (animation === "rotate") {
        meshRef.current.rotation.z = t * 2;
      }
    }
  });

  const entryScale = interpolate(progress, [0, 0.2], [0, 1], {
    extrapolateRight: "clamp",
  });

  const finalScale = animation === "pulse" ? 1 : baseScale * entryScale;

  // ... (renderGeometry function omitted for brevity, logic unchanged) ...
  const renderGeometry = () => {
    switch (shape) {
      case "cube":
        return <boxGeometry args={[2, 2, 2]} />;
      case "sphere":
        return <sphereGeometry args={[1.2, 32, 32]} />;
      case "pyramid":
        return <coneGeometry args={[1.2, 2, 4]} />;
      case "torus":
        // Ultra-thin torus for orbit paths
        return <torusGeometry args={[1, 0.02, 16, 100]} />;
      case "cylinder":
        return <cylinderGeometry args={[1, 1, 2, 32]} />;
      default:
        return <boxGeometry args={[2, 2, 2]} />;
    }
  };

  // Determine group position:
  // If orbiting, the GROUP is anchored at [0,0,0] so the mesh orbits around the scene center.
  // Otherwise, the GROUP is at the object's defined position.
  const groupPosition: [number, number, number] = object.animation === "orbit" ? [0, 0, 0] : position;

  return (
    <group>
      {object.animation === "orbit" && object.showTrajectory !== false && (
        <OrbitPath radius={Math.sqrt(position[0]**2 + position[2]**2) || 2} color={color} />
      )}
      <group position={groupPosition}>
        <mesh ref={meshRef} scale={[finalScale, finalScale, finalScale]}>
        {renderGeometry()}
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
        />
        {label && (
          // Labels attached to RIM for Torus, CENTER-TOP for others
          <Html 
            distanceFactor={8} 
            position={shape === "torus" ? [1.1, 0, 0] : [0, 0.6, 0]} 
            center
            style={{ pointerEvents: 'none' }} // Prevent blocking
          >
            <div style={{
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "14px",
              whiteSpace: "nowrap",
              fontFamily: "sans-serif",
              border: "1px solid rgba(255,255,255,0.3)"
            }}>
              {label}
            </div>
          </Html>
        )}
      </mesh>
      </group>
    </group>
  );
};

export const ThreeDSlide: React.FC<ThreeDSlideProps> = ({
  title,
  objects,
  cameraPosition,
  shape = "cube",
  color = "#6366f1",
  backgroundColor = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;

  // Backward compatibility: if no objects array, use the single shape props
  const finalObjects: ThreeDObject[] = objects || [
    {
      shape,
      color,
      position: [0, 0, 0],
      scale: 1,
      animation: "none",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
        position: "absolute", // Force absolute to prevent relative flow issues
        inset: 0,             // Force full coverage of parent
        overflow: "visible",
      }}
    >
      {/* 3D Canvas takes the whole video area - FULLSCREEN */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}>
    <Canvas
  camera={{ 
    position: [10, 8, 10], 
    fov: 60,
    near: 0.1,
    far: 100000
  }}
  style={{ width: "100%", height: "100%" }}
>
  <ambientLight intensity={0.5} />
  <directionalLight position={[10, 10, 5]} intensity={1} />
  <pointLight position={[-10, -10, -5]} intensity={0.5} color="#818cf8" />
  
  <group position={[0, 0, 0]} scale={0.6}>
    {finalObjects.map((obj, i) => (
      <AnimatedShape key={i} object={obj} progress={progress} />
    ))}
  </group>

  <Environment preset="city" />
  <OrbitControls 
    enableZoom={false} 
    enablePan={false} 
    enableRotate={false} 
    target={[0, 0, 0]}
  />
</Canvas>
      </div>

    </div>
  );
};
