"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";

export function CeilingFan({ position }: { position: [number, number, number] }) {
  const fanBladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (fanBladesRef.current) {
      fanBladesRef.current.rotation.y += delta * 12.0;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8]} />
        <meshStandardMaterial color="#111" metalness={0.9} />
      </mesh>

      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.12]} />
        <meshStandardMaterial color="#222" metalness={0.8} />
      </mesh>

      <group ref={fanBladesRef} position={[0, -0.02, 0]}>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, idx) => (
          <mesh key={idx} rotation={[0, angle, 0]} position={[0.45 * Math.sin(angle), 0, 0.45 * Math.cos(angle)]}>
            <boxGeometry args={[0.12, 0.01, 0.7]} />
            <meshStandardMaterial color="#333" metalness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function DigitalScheduleBoard({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[3.2, 1.4, 0.15]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[3.0, 1.2]} />
        <meshBasicMaterial color="#047857" />
      </mesh>
      <mesh position={[0, 0.55, 0.09]}>
        <planeGeometry args={[2.8, 0.08]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
    </group>
  );
}

export function WasteBins({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[-0.25, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.8]} />
        <meshStandardMaterial color="#2563EB" roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.8]} />
        <meshStandardMaterial color="#16A34A" roughness={0.4} />
      </mesh>
    </group>
  );
}

export function CooliePoint() {
  const setSelectedFacility = useSimulationStore((s) => s.setSelectedFacility);

  return (
    <group
      position={[10, 0, 25]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedFacility(LUCKNOW_STATION_FACILITIES.find((f) => f.id === "coolie-point") || null);
      }}
    >
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[3.0, 0.4, 0.8]} />
        <meshStandardMaterial color="#DC2626" roughness={0.5} />
      </mesh>

      {[-1.2, 1.2].map((xT, idx) => (
        <group key={idx} position={[xT, 0, 0.8]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.7, 0.4, 1.0]} />
            <meshStandardMaterial color="#64748B" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.8, -0.45]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8]} />
            <meshStandardMaterial color="#333" metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function StationDetails() {
  return (
    <group position={[0, 0, 0]}>
      <CeilingFan position={[-10, 3.8, 14]} />
      <CeilingFan position={[10, 3.8, 14]} />
      <CeilingFan position={[-10, 3.8, 2]} />
      <CeilingFan position={[10, 3.8, 2]} />
      <CeilingFan position={[-10, 3.8, 20]} />
      <CeilingFan position={[10, 3.8, 20]} />

      <DigitalScheduleBoard position={[0, 3.5, 23]} />
      <DigitalScheduleBoard position={[-12, 3.5, 8]} rotationY={Math.PI / 2} />

      <WasteBins position={[-8, 0, 24]} />
      <WasteBins position={[8, 0, 24]} />
      <WasteBins position={[-16, 0, 6]} />

      <CooliePoint />
    </group>
  );
}
