import { Environment, Html, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo, useRef } from "react";
import { Html5Audio, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getAudioSrc } from "../utils/audio-src";
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
  narrationUrl?: string;
}

interface ShapeProps {
  object: ThreeDObject;
  progress: number;
  dynamicScale: number;
}

const AnimatedShape: React.FC<ShapeProps> = ({ object, progress, dynamicScale }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { shape, color, position, scale: baseScale, animation: rawAnimation, label } = object;

  // Disable pulse for spheres
  const animation = (shape === "sphere" && rawAnimation === "pulse") ? "none" : rawAnimation;

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      const [rx, ry, rz] = object.rotation || [0, 0, 0];
      
      meshRef.current.rotation.x = rx;
      meshRef.current.rotation.y = ry + (animation === "rotate" ? t * 0.5 : 0);
      meshRef.current.rotation.z = rz;

      if (animation === "float") {
        meshRef.current.position.y = position[1] + Math.sin(t * 2) * 0.3;
      } else if (animation === "orbit") {
        const radius = Math.sqrt(position[0]**2 + position[2]**2) || 2;
        const initialAngle = Math.atan2(position[2], position[0]);
        const angle = t * (object.orbitSpeed || 0.5) + initialAngle;
        meshRef.current.position.x = Math.cos(angle) * radius;
        meshRef.current.position.z = Math.sin(angle) * radius;
        meshRef.current.position.y = position[1];
      }
    }
  });

  const entryScale = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const finalScale = baseScale * dynamicScale * entryScale;

  const renderGeometry = () => {
    switch (shape) {
      case "cube":
        return <boxGeometry args={[1.5, 1.5, 1.5]} />;
      case "sphere":
        return <sphereGeometry args={[0.8, 32, 32]} />;
      case "pyramid":
        return <coneGeometry args={[0.8, 1.5, 4]} />;
      case "torus":
        return <torusGeometry args={[0.6, 0.2, 16, 48]} />;
      case "cylinder":
        return <cylinderGeometry args={[0.6, 0.6, 1.5, 32]} />;
      default:
        return <boxGeometry args={[1.5, 1.5, 1.5]} />;
    }
  };

  const groupPosition: [number, number, number] = animation === "orbit" ? [0, 0, 0] : position;

  return (
    <group position={groupPosition}>
      <mesh ref={meshRef} scale={[finalScale, finalScale, finalScale]} position={animation === "orbit" ? undefined : [0, 0, 0]}>
        {renderGeometry()}
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.3}
        />
        {label && (
          <Html 
            distanceFactor={6} 
            position={[0, 1.2, 0]} 
            center
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "16px",
              whiteSpace: "nowrap",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.2)"
            }}>
              {label}
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
};

export const ThreeDSlide: React.FC<ThreeDSlideProps> = ({
  title,
  objects,
  cameraPosition,
  shape = "cube",
  color = "#6366f1",
  backgroundColor = "#0f0f1a",
  narrationUrl,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const progress = frame / durationInFrames;

  // Backward compatibility: if no objects array, use the single shape props
  const finalObjects: ThreeDObject[] = objects || [
    {
      shape,
      color,
      position: [0, 0, 0],
      scale: 1,
      animation: "float",
    },
  ];

  // DYNAMIC SCALING: Calculate based on object count
  const dynamicScale = useMemo(() => {
    const count = finalObjects.length;
    if (count <= 1) return 1.5;
    if (count <= 2) return 1.2;
    if (count <= 4) return 0.9;
    return 0.6;
  }, [finalObjects.length]);

  // DYNAMIC CAMERA: Calculate based on scene bounds
  const calculatedCamera = useMemo<[number, number, number]>(() => {
    if (cameraPosition) return cameraPosition;
    
    const count = finalObjects.length;
    const maxDist = Math.max(
      ...finalObjects.map(o => 
        Math.sqrt(o.position[0]**2 + o.position[1]**2 + o.position[2]**2)
      ),
      2
    );
    
    // Closer camera for fewer objects, farther for more
    const baseDist = count <= 2 ? 6 : count <= 4 ? 8 : 12;
    const finalDist = baseDist + maxDist * 0.5;
    
    return [finalDist * 0.6, finalDist * 0.4, finalDist * 0.8];
  }, [finalObjects, cameraPosition]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ 
          position: calculatedCamera, 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.4} color="#818cf8" />

        {/* Center the scene */}
        <group position={[0, 0, 0]}>
          {finalObjects.map((obj, i) => (
            <AnimatedShape 
              key={i} 
              object={obj} 
              progress={progress} 
              dynamicScale={dynamicScale}
            />
          ))}
        </group>

        <Environment preset="city" />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableRotate={false} 
          target={[0, 0, 0]}
        />
      </ThreeCanvas>

      {/* Title overlay */}
      {title && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
            fontSize: 42,
            fontWeight: 700,
            color: "#ffffff",
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {title}
        </div>
      )}
      {narrationUrl && <Html5Audio src={getAudioSrc(narrationUrl)} />}
    </div>
  );
};
