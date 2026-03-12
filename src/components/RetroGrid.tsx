import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const ORANGE = new THREE.Color("#fb923c");
const GRID_SIZE = 40;
const GRID_DIVISIONS = 30;
const GRID_FADE_START = 15;

function PerspectiveGrid() {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  // Build grid lines geometry
  const gridGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const half = GRID_SIZE / 2;
    const step = GRID_SIZE / GRID_DIVISIONS;

    // Lines along Z axis
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const x = -half + i * step;
      const dist = Math.abs(x) / half;
      const alpha = Math.max(0, 1 - dist * 0.8) * 0.35;
      positions.push(x, 0, -half, x, 0, half);
      colors.push(ORANGE.r, ORANGE.g, ORANGE.b, alpha);
      colors.push(ORANGE.r, ORANGE.g, ORANGE.b, alpha * 0.05);
    }

    // Lines along X axis
    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const z = -half + i * step;
      const dist = (z + half) / GRID_SIZE;
      const alpha = Math.max(0, 1 - dist * 0.9) * 0.3;
      positions.push(-half, 0, z, half, 0, z);
      colors.push(ORANGE.r, ORANGE.g, ORANGE.b, alpha);
      colors.push(ORANGE.r, ORANGE.g, ORANGE.b, alpha);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
    return geo;
  }, []);

  // Particles flowing toward camera
  const particleCount = 60;
  const particlesGeo = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const half = GRID_SIZE / 2;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * GRID_SIZE;
      pos[i * 3 + 1] = 0.02;
      pos[i * 3 + 2] = -Math.random() * half;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    // Mouse parallax on camera
    const cam = state.camera;
    const targetX = pointer.x * 0.3;
    const targetY = 3 + pointer.y * 0.15;
    cam.position.x += (targetX - cam.position.x) * 0.02;
    cam.position.y += (targetY - cam.position.y) * 0.02;
    cam.lookAt(0, 0, -10);

    // Animate particles
    const positions = particlesGeo.attributes.position
      .array as Float32Array;
    const half = GRID_SIZE / 2;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 2] += delta * 2.5;
      if (positions[i * 3 + 2] > half * 0.3) {
        positions[i * 3 + 2] = -half;
        positions[i * 3] = (Math.random() - 0.5) * GRID_SIZE;
      }
    }
    particlesGeo.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial vertexColors transparent />
      </lineSegments>
      <points geometry={particlesGeo}>
        <pointsMaterial
          color={ORANGE}
          size={0.08}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
      {/* Horizon glow — radial falloff so edges are invisible */}
      <mesh position={[0, 0.5, -GRID_SIZE / 2]}>
        <planeGeometry args={[GRID_SIZE * 2, 14]} />
        <shaderMaterial
          transparent
          side={THREE.DoubleSide}
          uniforms={{ uColor: { value: new THREE.Color("#fb923c") } }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
              vec2 center = vUv - 0.5;
              float dist = length(center * vec2(1.6, 1.0));
              float alpha = smoothstep(0.5, 0.0, dist) * 0.06;
              gl_FragColor = vec4(uColor, alpha);
            }
          `}
        />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveGrid />
    </>
  );
}

export default function RetroGrid() {
  const [webgl, setWebgl] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setWebgl(false);
    } catch {
      setWebgl(false);
    }
  }, []);

  if (!webgl) {
    // CSS-only fallback
    return (
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, rgba(251,146,60,0.08) 0%, transparent 60%)",
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 3, 8], fov: 60, near: 0.1, far: 100 }}
        style={{ pointerEvents: "none" }}
        gl={{ antialias: false, alpha: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
