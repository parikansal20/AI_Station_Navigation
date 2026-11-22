"use client";

import { Suspense, useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerformanceMonitor } from "@react-three/drei";

import GroundFloor from "@/components/station/GroundFloor";
import FirstFloorFOB from "@/components/station/FirstFloorFOB";
import Platforms from "@/components/station/Platforms";
import ParkingArea from "@/components/station/ParkingArea";
import StationDetails from "@/components/station/StationDetails";
import PassengerCrowd from "@/components/station/PassengerCrowd";
import Train from "@/components/station/Train";
import FirstPersonController from "./FirstPersonController";
import PathRenderer from "./PathRenderer";
import TeleportHandler from "./TeleportHandler";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";

function CrowdParticles() {
  const showCrowdHeatmap = useSimulationStore((s) => s.showCrowdHeatmap);

  const particles = useMemo(() => {
    const coords: { pos: [number, number, number]; color: string }[] = [];
    LUCKNOW_STATION_FACILITIES.forEach((fac) => {
      const count = fac.crowdLevel === "High" ? 40 : fac.crowdLevel === "Moderate" ? 20 : 8;
      const color = fac.crowdLevel === "High" ? "#EF4444" : fac.crowdLevel === "Moderate" ? "#F59E0B" : "#10B981";

      for (let i = 0; i < count; i++) {
        coords.push({
          pos: [
            fac.position[0] + (Math.random() - 0.5) * 6,
            fac.position[1] + (Math.random() - 0.5) * 0.4,
            fac.position[2] + (Math.random() - 0.5) * 6,
          ],
          color,
        });
      }
    });
    return coords;
  }, []);

  if (!showCrowdHeatmap) return null;

  return (
    <group>
      {particles.map((p, idx) => (
        <mesh key={idx} position={p.pos}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export default function SceneCanvas() {
  const controlMode = useSimulationStore((s) => s.controlMode);
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: [0, 24, 52], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="!touch-none"
    >
      <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
      <color attach="background" args={["#CBD5E1"]} />
      <fog attach="fog" args={["#CBD5E1", 60, 160]} />

      <ambientLight intensity={0.75} color="#FFF5EA" />
      
      <directionalLight
        position={[30, 50, 30]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
      />
      
      <directionalLight position={[-20, 20, -20]} intensity={0.4} color="#F59E0B" />
      <pointLight position={[0, 4.0, 12]} intensity={0.8} color="#FFEDD5" distance={25} />
      <pointLight position={[0, 4.0, -2]} intensity={0.8} color="#FFEDD5" distance={25} />

      <Suspense fallback={null}>
        <GroundFloor />
        <ParkingArea />
        <StationDetails />
        <FirstFloorFOB />
        <Platforms />
        <PassengerCrowd />

        <Train trackZ={-12} initialX={-10} direction={1} speed={0.06} />
        <Train trackZ={-25} initialX={25} direction={-1} speed={0.09} isVandeBharat />

        <PathRenderer />
        <TeleportHandler />
        <CrowdParticles />

        <Environment preset="city" />
      </Suspense>

      {controlMode === "orbit" ? (
        <OrbitControls
          makeDefault
          minDistance={2.5}
          maxDistance={90}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 3, 6]}
          enableDamping
          dampingFactor={0.08}
        />
      ) : (
        <FirstPersonController />
      )}
    </Canvas>
  );
}
